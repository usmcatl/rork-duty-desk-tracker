/**
 * Duty Desk Tracker — Google Sheets sync endpoint.
 *
 * Paste this whole file into Extensions > Apps Script of the Google Sheet that
 * should hold the Post's data, run setup() once, then deploy as a web app.
 * Full instructions: google-sheets-sync/README.md in the project repository.
 *
 * Each table gets its own tab. The first five columns are used by the app:
 *   id | updatedAt | deleted | device | json
 * The "json" column is the source of truth; the columns after it are a
 * readable copy of each record for people browsing the sheet. Editing the
 * readable columns does NOT change data in the app.
 */

var TABLES = {
  members: 'Members',
  equipment: 'Equipment',
  checkouts: 'Checkouts',
  packages: 'Packages',
  shifts: 'Shifts',
  settings: 'Settings'
};
var META_COLUMNS = ['id', 'updatedAt', 'deleted', 'device', 'json'];
var PHOTO_FOLDER_NAME = 'Duty Desk Tracker Photos';

/** Run once from the editor. Creates the tabs and the sync token. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('SYNC_TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('SYNC_TOKEN', token);
  }
  Object.keys(TABLES).forEach(function (table) {
    getSheet_(table);
  });
  getPhotoFolder_();
  Logger.log('Sync token (enter this in the app under Settings > Google Sheets Sync): ' + token);
}

function doGet() {
  return json_({ ok: true, app: 'Duty Desk Tracker sync', message: 'Endpoint is running. The app talks to it with POST requests.' });
}

function doPost(e) {
  var request;
  try {
    request = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'Invalid request body' });
  }

  var token = PropertiesService.getScriptProperties().getProperty('SYNC_TOKEN');
  if (!token) {
    return json_({ ok: false, error: 'Sync is not set up. Run setup() in the Apps Script editor.' });
  }
  if (request.token !== token) {
    return json_({ ok: false, error: 'Wrong sync token' });
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return json_({ ok: false, error: 'The sheet is busy with another sync. Try again shortly.' });
  }
  try {
    switch (request.action) {
      case 'ping':
        return json_({ ok: true });
      case 'sync':
        return json_(sync_(request));
      case 'photo':
        return json_(savePhoto_(request));
      default:
        return json_({ ok: false, error: 'Unknown action: ' + request.action });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

function sync_(request) {
  var device = String(request.device || 'unknown');
  var since = Number(request.since || 0);

  // Timestamps must strictly increase between syncs, or a device whose pull
  // returned the same millisecond as another device's write would miss it.
  var props = PropertiesService.getScriptProperties();
  var now = Math.max(Date.now(), Number(props.getProperty('LAST_SYNC_TIME') || 0) + 1);
  props.setProperty('LAST_SYNC_TIME', String(now));

  var writesByTable = {};
  (request.changes || []).forEach(function (change) {
    if (!TABLES[change.table]) return;
    (writesByTable[change.table] = writesByTable[change.table] || []).push({ id: String(change.id), data: change.data, deleted: false });
  });
  (request.deletes || []).forEach(function (del) {
    if (!TABLES[del.table]) return;
    (writesByTable[del.table] = writesByTable[del.table] || []).push({ id: String(del.id), data: null, deleted: true });
  });

  var rows = [];
  Object.keys(TABLES).forEach(function (table) {
    var sheet = getSheet_(table);
    var writes = writesByTable[table] || [];
    if (writes.length) {
      applyWrites_(sheet, writes, device, now);
    }
    rows = rows.concat(readChangedRows_(sheet, table, since));
  });

  return { ok: true, serverTime: now, rows: rows };
}

function applyWrites_(sheet, writes, device, now) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(String);

  // Grow the readable columns to cover every field we are about to write.
  writes.forEach(function (write) {
    if (!write.data) return;
    Object.keys(write.data).forEach(function (field) {
      if (headers.indexOf(field) === -1) headers.push(field);
    });
  });

  var rowIndexById = {};
  for (var r = 1; r < values.length; r++) {
    rowIndexById[String(values[r][0])] = r;
  }

  writes.forEach(function (write) {
    var index = rowIndexById[write.id];
    if (write.deleted && index === undefined) return;

    var row = new Array(headers.length).fill('');
    if (index !== undefined && write.deleted) {
      // Keep the last readable values so deleted records stay visible for audit.
      row = values[index].slice();
    }
    row[0] = write.id;
    row[1] = now;
    row[2] = write.deleted ? 'TRUE' : '';
    row[3] = device;
    row[4] = write.deleted ? (index !== undefined ? values[index][4] : '') : JSON.stringify(write.data);

    if (!write.deleted) {
      for (var c = META_COLUMNS.length; c < headers.length; c++) {
        row[c] = readable_(write.data[headers[c]]);
      }
    }

    if (index === undefined) {
      rowIndexById[write.id] = values.length;
      values.push(row);
    } else {
      values[index] = row;
    }
  });

  values[0] = headers;
  var width = headers.length;
  var output = values.map(function (row) {
    var padded = row.slice(0, width);
    while (padded.length < width) padded.push('');
    return padded;
  });

  var range = sheet.getRange(1, 1, output.length, width);
  range.setNumberFormat('@');
  range.setValues(output.map(function (row) {
    return row.map(function (cell) { return cell === null || cell === undefined ? '' : String(cell); });
  }));
}

function readChangedRows_(sheet, table, since) {
  var values = sheet.getDataRange().getValues();
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var updatedAt = Number(values[r][1]);
    if (!(updatedAt > since)) continue;
    var deleted = String(values[r][2]).toUpperCase() === 'TRUE';
    var data = null;
    if (!deleted) {
      try {
        data = JSON.parse(values[r][4]);
      } catch (err) {
        continue; // Skip rows whose json cell was damaged by hand-editing.
      }
    }
    rows.push({ table: table, id: String(values[r][0]), deleted: deleted, device: String(values[r][3]), data: data });
  }
  return rows;
}

function savePhoto_(request) {
  var name = String(request.name || ('photo-' + Date.now() + '.jpg')).replace(/[\\/]/g, '_');
  var folder = getPhotoFolder_();
  var existing = folder.getFilesByName(name);
  if (existing.hasNext()) {
    return { ok: true, fileId: existing.next().getId() };
  }
  var blob = Utilities.newBlob(Utilities.base64Decode(request.data), request.mimeType || 'image/jpeg', name);
  var file = folder.createFile(blob);
  return { ok: true, fileId: file.getId() };
}

function getSheet_(table) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var name = TABLES[table];
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.getRange(1, 1, 1, META_COLUMNS.length).setValues([META_COLUMNS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, META_COLUMNS.length).setFontWeight('bold');
  }
  return sheet;
}

function getPhotoFolder_() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('PHOTO_FOLDER_ID');
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (err) {
      // Folder was deleted; fall through and create a new one.
    }
  }
  var folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
  props.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

function readable_(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map(function (item) { return typeof item === 'object' ? JSON.stringify(item) : String(item); }).join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
