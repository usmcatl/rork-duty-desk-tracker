/**
 * Duty Desk Tracker - Google Sheets sync endpoint.
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

  var hasContactsTrigger = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === 'syncMembersFromContacts';
  });
  if (!hasContactsTrigger) {
    ScriptApp.newTrigger('syncMembersFromContacts').timeBased().everyDays(1).atHour(3).create();
  }
  var result = syncMembersFromContacts();

  Logger.log('Members from Google Contacts: ' + result.members + ' (' + result.active + ' active), ' + result.written + ' rows updated.');
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

  // Read-only; doesn't need to wait for other syncs to finish.
  if (request.action === 'getPhoto') {
    try {
      return json_(getPhoto_(request));
    } catch (err) {
      return json_({ ok: false, error: String(err && err.message ? err.message : err) });
    }
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
      case 'importRoster':
        return json_(importRoster_(request));
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

  var now = nextTimestamp_();

  var writesByTable = {};
  (request.changes || []).forEach(function (change) {
    if (!TABLES[change.table]) return;
    (writesByTable[change.table] = writesByTable[change.table] || []).push({ id: String(change.id), data: change.data, deleted: false });
  });
  (request.deletes || []).forEach(function (del) {
    if (!TABLES[del.table]) return;
    (writesByTable[del.table] = writesByTable[del.table] || []).push({ id: String(del.id), data: null, deleted: true });
  });

  if (writesByTable.members) {
    pushMemberIdsToContacts_(writesByTable.members);
  }

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

/**
 * Timestamps must strictly increase between writes, or a device whose pull
 * returned the same millisecond as another write would miss it. Callers must
 * hold the script lock.
 */
function nextTimestamp_() {
  var props = PropertiesService.getScriptProperties();
  var now = Math.max(Date.now(), Number(props.getProperty('LAST_SYNC_TIME') || 0) + 1);
  props.setProperty('LAST_SYNC_TIME', String(now));
  return now;
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

/* ---------------------------------------------------------------------------
 * Members from Google Contacts
 *
 * The Post's contacts are the membership roster. Each contact carries year
 * labels ("2026 Renewed", "2027 New Member", ...) and group labels
 * ("General Membership", "Auxiliary", "SAL", "PUFL", "Supporter ...").
 * Anyone with a year label or PUFL becomes a member in the app:
 *   - Active:   a label for the current year or later, or PUFL (paid up for life)
 *   - Inactive: only past-year labels
 * Runs daily (trigger installed by setup) and writes changes to the Members
 * tab, which the tablets pick up on their next sync. Requires the People API
 * advanced service (Services > People API in the Apps Script editor).
 * ------------------------------------------------------------------------- */

var CONTACTS_DEVICE = 'google-contacts';
var CONTACT_ID_PREFIX = 'contact-';
// Fields the app manages itself; contact syncs keep whatever the app has.
var APP_OWNED_MEMBER_FIELDS = ['aliases', 'associatedMembers', 'involvementInterests', 'addedBy', 'dateOfBirth', 'branch'];

function syncMembersFromContacts() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) {
    throw new Error('Another sync is running; try again in a minute.');
  }
  try {
    return syncMembersFromContacts_();
  } finally {
    lock.releaseLock();
  }
}

function syncMembersFromContacts_() {
  var currentYear = new Date().getFullYear();

  var groupNames = {};
  var pageToken;
  do {
    var groups = People.ContactGroups.list({ pageSize: 1000, pageToken: pageToken });
    (groups.contactGroups || []).forEach(function (group) {
      groupNames[group.resourceName] = group.formattedName || group.name;
    });
    pageToken = groups.nextPageToken;
  } while (pageToken);

  var members = {};
  var people = {};
  pageToken = undefined;
  do {
    var page = People.People.Connections.list('people/me', {
      pageSize: 1000,
      pageToken: pageToken,
      personFields: 'names,emailAddresses,phoneNumbers,addresses,biographies,memberships'
    });
    (page.connections || []).forEach(function (person) {
      var member = memberFromContact_(person, groupNames, currentYear);
      if (member) {
        members[member.id] = member;
        people[member.id] = person;
      }
    });
    pageToken = page.nextPageToken;
  } while (pageToken);

  var sheet = getSheet_('members');
  var values = sheet.getDataRange().getValues();
  var existing = {};
  var lastWriter = {};
  for (var r = 1; r < values.length; r++) {
    var id = String(values[r][0]);
    if (id.indexOf(CONTACT_ID_PREFIX) !== 0 || String(values[r][2]).toUpperCase() === 'TRUE') continue;
    try {
      existing[id] = JSON.parse(values[r][4]);
      lastWriter[id] = String(values[r][3]);
    } catch (err) {
      // A damaged json cell is simply rewritten below.
    }
  }

  var writes = [];
  Object.keys(members).forEach(function (id) {
    var next = members[id];
    var prev = existing[id];
    if (prev) {
      APP_OWNED_MEMBER_FIELDS.forEach(function (field) {
        if (prev[field] !== undefined) next[field] = prev[field];
      });
      // A member ID set in the app that hasn't reached the contact yet (the
      // immediate write-back failed): keep it and retry the write-back.
      if (prev.memberId && prev.memberId !== next.memberId && lastWriter[id] !== CONTACTS_DEVICE) {
        try {
          next.notes = writeMemberIdToContact_(people[id], prev.memberId);
          next.memberId = prev.memberId;
        } catch (err) {
          next.memberId = prev.memberId;
          Logger.log('Could not save member ID to contact ' + id + ': ' + err);
        }
      }
    }
    if (!prev || stableStringify_(prev) !== stableStringify_(next)) {
      writes.push({ id: id, data: next, deleted: false });
    }
  });

  // Contacts that were deleted or lost all membership labels stay in the app
  // (packages and checkouts may reference them) but are no longer Active.
  Object.keys(existing).forEach(function (id) {
    var prev = existing[id];
    if (!members[id] && prev && prev.status === 'Active') {
      prev.status = 'Inactive';
      writes.push({ id: id, data: prev, deleted: false });
    }
  });

  if (writes.length) {
    applyWrites_(sheet, writes, CONTACTS_DEVICE, nextTimestamp_());
  }

  var ids = Object.keys(members);
  return {
    members: ids.length,
    active: ids.filter(function (id) { return members[id].status === 'Active'; }).length,
    written: writes.length
  };
}

function memberFromContact_(person, groupNames, currentYear) {
  var labels = (person.memberships || [])
    .map(function (m) { return m.contactGroupMembership && groupNames[m.contactGroupMembership.contactGroupResourceName]; })
    .filter(function (name) { return name; });
  var lowerLabels = labels.map(function (label) { return String(label).toLowerCase(); });

  var years = [];
  labels.forEach(function (label) {
    var match = /^(\d{4})\b/.exec(label);
    if (match && years.indexOf(Number(match[1])) === -1) years.push(Number(match[1]));
  });
  years.sort();
  var lifetime = lowerLabels.indexOf('pufl') !== -1;
  if (!years.length && !lifetime) {
    return null; // Not a member: vendors, volunteers-only, etc.
  }

  var notes = ((person.biographies || [])[0] || {}).value || '';
  var membershipType = (/Membership Type:\s*(.+)/i.exec(notes) || [])[1] || '';
  var memberIdMatch = /Member\s*(?:ID|#|No\.?|Number)\s*[:#]?\s*([A-Za-z0-9-]+)/i.exec(notes);
  var mailingAddress = (/Mailing Address:\s*(.+)/i.exec(notes) || [])[1] || '';

  var name = ((person.names || [])[0] || {}).displayName || ((person.emailAddresses || [])[0] || {}).value || 'Unnamed contact';
  var address = ((person.addresses || [])[0] || {}).formattedValue || mailingAddress;

  var status = lifetime || years.some(function (year) { return year >= currentYear; }) ? 'Active' : 'Inactive';
  if (lowerLabels.indexOf('deceased') !== -1 || /\bdeceased\b/i.test(membershipType)) {
    status = 'Deceased';
  }

  var typeAndLabels = (lowerLabels.join('|') + '|' + membershipType.toLowerCase());
  var group = 'Legion';
  if (lowerLabels.indexOf('general membership') !== -1) {
    group = 'Legion';
  } else if (/auxiliary|\bala\b/.test(typeAndLabels)) {
    group = 'Auxiliary';
  } else if (/\bsal\b|sons of the american legion/.test(typeAndLabels)) {
    group = 'Sons of the American Legion';
  } else if (/legion riders/.test(typeAndLabels)) {
    group = 'Legion Riders';
  }

  var member = {
    id: CONTACT_ID_PREFIX + String(person.resourceName).split('/').pop(),
    memberId: memberIdMatch ? memberIdMatch[1] : '',
    name: name,
    email: ((person.emailAddresses || [])[0] || {}).value || '',
    status: status,
    group: group,
    source: 'google-contacts',
    membershipYears: years,
    membershipLabels: labels.filter(function (label) { return label !== 'ALL'; })
  };
  var phone = ((person.phoneNumbers || [])[0] || {}).value;
  if (phone) member.phone = phone;
  if (address) member.address = address;
  if (notes) member.notes = notes;
  if (years.length) member.joinDate = new Date(Date.UTC(years[0], 0, 1)).toISOString();
  return member;
}

/**
 * Save a member ID into the contact's notes as a "Member ID: <id>" line,
 * replacing an existing one. altIds (optional) are extra current HQ IDs for
 * the same person, kept on an "Also HQ ID:" line. Returns the updated notes.
 */
function memberIdNotes_(notes, memberId, altIds) {
  var line = 'Member ID: ' + memberId;
  var pattern = /^.*Member\s*(?:ID|#|No\.?|Number)\s*[:#]?.*$/im;
  var updated = pattern.test(notes) ? notes.replace(pattern, line) : (notes ? notes + '\n' + line : line);
  if (altIds && altIds.length) {
    var altLine = 'Also HQ ID: ' + altIds.join(', ');
    var altPattern = /^Also HQ ID:.*$/im;
    updated = altPattern.test(updated) ? updated.replace(altPattern, altLine) : updated.replace(line, line + '\n' + altLine);
  }
  return updated;
}

function writeMemberIdToContact_(person, memberId, altIds) {
  var notes = ((person.biographies || [])[0] || {}).value || '';
  var updated = memberIdNotes_(notes, memberId, altIds);
  if (updated === notes) return notes;

  People.People.updateContact(
    { etag: person.etag, biographies: [{ value: updated, contentType: 'TEXT_PLAIN' }] },
    person.resourceName,
    { updatePersonFields: 'biographies' }
  );
  return updated;
}

/**
 * Called during a tablet sync: push member IDs set in the app for
 * contact-sourced members back to Google Contacts right away. Failures are
 * logged and retried by the daily contacts sync; they never fail the sync.
 */
function pushMemberIdsToContacts_(changes) {
  changes.forEach(function (change) {
    var data = change.data;
    if (!data || !data.memberId || String(change.id).indexOf(CONTACT_ID_PREFIX) !== 0) return;
    try {
      var person = People.People.get('people/' + String(change.id).substring(CONTACT_ID_PREFIX.length), { personFields: 'biographies' });
      var current = /Member\s*(?:ID|#|No\.?|Number)\s*[:#]?\s*([A-Za-z0-9-]+)/i.exec(((person.biographies || [])[0] || {}).value || '');
      if (!current || current[1] !== data.memberId) {
        writeMemberIdToContact_(person, data.memberId);
      }
    } catch (err) {
      Logger.log('Member ID write-back failed for ' + change.id + ': ' + err);
    }
  });
}

/* ---------------------------------------------------------------------------
 * National HQ roster import (Legion and SAL)
 *
 * The HQ roster is authoritative for who is a member. For each roster row:
 *   - find the contact (email, then phone, then last+first name; an email or
 *     phone match must agree on the last name, allowing small spelling
 *     differences when the first name also matches);
 *   - write the member ID into the contact's notes (extra current IDs go on
 *     an "Also HQ ID:" line);
 *   - add a year label for HQ's paid-through year when it is later than the
 *     contact's latest year label (or the contact has none), the PUFL label
 *     for HQ lifetime members, and the group label (General Membership / SAL);
 *   - create a contact for roster members who have none.
 * HQ emails and phones never overwrite existing contact details, and labels
 * are only ever added, never removed.
 * request: { rows: [{ roster, memberId, altIds, name, email, phone, type,
 *            paidThrough, status }], apply: bool, refresh: bool }
 * ------------------------------------------------------------------------- */

var POST_EMAIL = 'americanlegionchapala@gmail.com';

function importRoster_(request) {
  var rows = request.rows || [];
  var apply = request.apply === true;

  var groupNames = {};
  var pageToken;
  do {
    var groups = People.ContactGroups.list({ pageSize: 1000, pageToken: pageToken });
    (groups.contactGroups || []).forEach(function (group) {
      groupNames[group.resourceName] = group.formattedName || group.name;
    });
    pageToken = groups.nextPageToken;
  } while (pageToken);

  var contacts = [];
  pageToken = undefined;
  do {
    var page = People.People.Connections.list('people/me', {
      pageSize: 1000,
      pageToken: pageToken,
      personFields: 'names,emailAddresses,phoneNumbers,biographies,memberships'
    });
    (page.connections || []).forEach(function (person) {
      contacts.push(rosterContact_(person, groupNames));
    });
    pageToken = page.nextPageToken;
  } while (pageToken);

  var labelAdds = {}; // label name -> [person resourceName]
  var queueLabel = function (label, resourceName) {
    (labelAdds[label] = labelAdds[label] || []).push(resourceName);
  };

  var report = [];
  var written = 0;
  var created = 0;
  rows.forEach(function (row) {
    var altIds = row.altIds || [];
    var hqYear = Number(row.paidThrough) || null;
    var groupLabel = row.roster === 'SAL' ? 'SAL' : 'General Membership';
    var lifetime = /^PUFL/i.test(String(row.type || ''));
    var yearLabel = hqYear ? yearLabelName_(hqYear, groupNames) : null;
    var result = { roster: row.roster, memberId: row.memberId, altIds: altIds, name: row.name, hqPaidThrough: row.paidThrough, hqStatus: row.status };

    var match = findRosterContact_(row, contacts);
    result.match = match.method;
    if (match.candidates) result.candidates = match.candidates;

    if (!match.contact) {
      if (match.method !== 'not-found') {
        report.push(result); // ambiguous or someone else's email: left for a person to sort out
        return;
      }
      result.action = 'create';
      result.labelsAdded = [yearLabel, groupLabel, lifetime ? 'PUFL' : null, 'ALL'].filter(function (l) { return l; });
      if (apply) {
        try {
          var person = People.People.createContact(newRosterContact_(row, altIds));
          result.labelsAdded.forEach(function (label) { queueLabel(label, person.resourceName); });
          contacts.push(rosterContact_(person, groupNames));
          created++;
          Utilities.sleep(1000); // People API write rate limit
        } catch (err) {
          result.action = 'error';
          result.error = String(err && err.message ? err.message : err);
        }
      }
      report.push(result);
      return;
    }

    var c = match.contact;
    result.contact = c.name;
    result.contactIsMember = c.isMember;
    result.contactMaxYear = c.maxYear;
    result.contactLifetime = c.lifetime;
    result.previousId = c.memberId;

    var newNotes = memberIdNotes_(c.notes, row.memberId, altIds);
    result.action = newNotes === c.notes ? 'already-set' : (c.memberId && c.memberId !== row.memberId ? 'replace' : 'add');
    result.labelsAdded = [];
    if (yearLabel && (c.maxYear === null || hqYear > c.maxYear)) result.labelsAdded.push(yearLabel);
    if (lifetime && !c.lifetime) result.labelsAdded.push('PUFL');
    if (c.labelsLower.indexOf(groupLabel.toLowerCase()) === -1) result.labelsAdded.push(groupLabel);

    if (apply) {
      try {
        if (newNotes !== c.notes) {
          writeMemberIdToContact_(c.person, row.memberId, altIds);
          c.notes = newNotes;
          c.memberId = row.memberId;
          written++;
          Utilities.sleep(1000); // People API write rate limit
        }
        result.labelsAdded.forEach(function (label) {
          queueLabel(label, c.person.resourceName);
          c.labelsLower.push(label.toLowerCase());
        });
        if (hqYear && result.labelsAdded.indexOf(yearLabel) !== -1) c.maxYear = hqYear;
      } catch (err) {
        result.action = 'error';
        result.error = String(err && err.message ? err.message : err);
      }
    }
    report.push(result);
  });

  var labeled = 0;
  if (apply) {
    Object.keys(labelAdds).forEach(function (label) {
      var groupResource = groupResourceName_(label, groupNames);
      var people = labelAdds[label].filter(function (p, i, all) { return all.indexOf(p) === i; });
      for (var i = 0; i < people.length; i += 500) {
        People.ContactGroups.Members.modify({ resourceNamesToAdd: people.slice(i, i + 500) }, groupResource);
        labeled += Math.min(500, people.length - i);
        Utilities.sleep(1000);
      }
    });
  }

  var refresh = null;
  if (apply && request.refresh !== false) {
    refresh = syncMembersFromContacts_(); // caller (doPost) already holds the script lock
  }
  return { ok: true, applied: apply, written: written, created: created, labeled: labeled, refresh: refresh, report: report };
}

function rosterContact_(person, groupNames) {
  var labels = (person.memberships || [])
    .map(function (m) { return m.contactGroupMembership && groupNames[m.contactGroupMembership.contactGroupResourceName]; })
    .filter(function (name) { return name; });
  var years = labels.map(function (l) { var m = /^(\d{4})\b/.exec(l); return m ? Number(m[1]) : 0; }).filter(Boolean);
  var labelsLower = labels.map(function (l) { return String(l).toLowerCase(); });
  var names = (person.names || [])[0] || {};
  var notes = ((person.biographies || [])[0] || {}).value || '';
  var idMatch = /Member\s*(?:ID|#|No\.?|Number)\s*[:#]?\s*([A-Za-z0-9-]+)/i.exec(notes);
  return {
    person: person,
    name: names.displayName || [names.givenName, names.familyName].filter(Boolean).join(' '),
    nameTokens: nameTokens_([names.givenName, names.middleName, names.familyName, names.displayName].join(' ')),
    familyTokens: nameTokens_(names.familyName || ''),
    givenTokens: nameTokens_(names.givenName || ''),
    emails: (person.emailAddresses || []).map(function (e) { return String(e.value || '').toLowerCase().trim(); })
      .filter(function (e) { return e && e !== POST_EMAIL; }),
    phones: (person.phoneNumbers || []).map(function (p) { return phoneKey_(p.value); }).filter(Boolean),
    labelsLower: labelsLower,
    maxYear: years.length ? Math.max.apply(null, years) : null,
    lifetime: labelsLower.indexOf('pufl') !== -1,
    isMember: years.length > 0 || labelsLower.indexOf('pufl') !== -1,
    notes: notes,
    memberId: idMatch ? idMatch[1] : ''
  };
}

/** Existing "<year> Renew..." label if there is one, else "<year> Renewed". */
function yearLabelName_(year, groupNames) {
  var names = Object.keys(groupNames).map(function (k) { return String(groupNames[k]); });
  var forYear = names.filter(function (n) { return n.indexOf(String(year) + ' ') === 0; });
  var renewal = forYear.filter(function (n) { return /renew/i.test(n); });
  return renewal[0] || String(year) + ' Renewed';
}

function groupResourceName_(label, groupNames) {
  var existing = Object.keys(groupNames).filter(function (k) { return String(groupNames[k]).toLowerCase() === label.toLowerCase(); });
  if (existing.length) return existing[0];
  var group = People.ContactGroups.create({ contactGroup: { name: label } });
  groupNames[group.resourceName] = label;
  return group.resourceName;
}

function newRosterContact_(row, altIds) {
  // HQ names are "Last, [Suffix,] First [Middle]".
  var parts = String(row.name || '').split(',').map(function (p) { return p.trim(); });
  var name = { familyName: titleCase_(parts[0]), givenName: titleCase_(parts[parts.length - 1]) };
  if (parts.length > 2) name.honorificSuffix = parts.slice(1, -1).join(' ');
  var body = {
    names: [name],
    biographies: [{
      contentType: 'TEXT_PLAIN',
      value: memberIdNotes_('', row.memberId, altIds) + '\nMembership Type: ' + (row.roster === 'SAL' ? 'SAL' : 'Legion') +
        '\nAdded from the National HQ roster on ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
    }]
  };
  var email = String(row.email || '').trim();
  if (email && email.toLowerCase() !== POST_EMAIL && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    body.emailAddresses = [{ value: email }];
  }
  if (phoneKey_(row.phone)) body.phoneNumbers = [{ value: String(row.phone).trim() }];
  return body;
}

function titleCase_(text) {
  var s = String(text || '').trim();
  // HQ sometimes sends ALL CAPS or all lower case; leave mixed case alone.
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s.toLowerCase().replace(/(^|[\s'-])([a-z])/g, function (m, sep, ch) { return sep + ch.toUpperCase(); });
}

function findRosterContact_(row, contacts) {
  // HQ names are "Last, [Suffix,] First [Middle]".
  var parts = String(row.name || '').split(',');
  var last = nameTokens_(parts[0]);
  var first = nameTokens_(parts[parts.length - 1])[0];
  var lastMatches = function (c) {
    return last.length > 0 && last.every(function (t) { return c.familyTokens.indexOf(t) !== -1 || c.nameTokens.indexOf(t) !== -1; });
  };
  var firstMatches = function (c) {
    return !!first && (c.givenTokens.indexOf(first) !== -1 || c.nameTokens.indexOf(first) !== -1);
  };
  // Same first name and a last name within a few letters (Guitierrez/Gutierrez).
  var closeName = function (c) {
    var hqLast = last.join('');
    var contactLast = (c.familyTokens.length ? c.familyTokens : c.nameTokens.slice(-1)).join('');
    return firstMatches(c) && hqLast.length >= 4 && editDistance_(hqLast, contactLast) <= 3;
  };

  // An email or phone match must also agree on the name; HQ data has shared
  // and mistyped emails that would otherwise land on the wrong person.
  var email = String(row.email || '').toLowerCase().trim();
  if (email && email !== POST_EMAIL) {
    var byEmail = contacts.filter(function (c) { return c.emails.indexOf(email) !== -1; });
    if (byEmail.length === 1) {
      if (lastMatches(byEmail[0])) return { contact: byEmail[0], method: 'email' };
      if (closeName(byEmail[0])) return { contact: byEmail[0], method: 'email-close-name' };
      return { method: 'email-name-mismatch', candidates: [byEmail[0].name] };
    }
  }
  var phone = phoneKey_(row.phone);
  if (phone) {
    var byPhone = contacts.filter(function (c) { return c.phones.indexOf(phone) !== -1; });
    if (byPhone.length === 1 && lastMatches(byPhone[0])) return { contact: byPhone[0], method: 'phone' };
  }

  if (!last.length || !first) return { method: 'not-found' };
  var byName = contacts.filter(function (c) { return lastMatches(c) && firstMatches(c); });
  if (byName.length === 1) return { contact: byName[0], method: 'name' };
  if (byName.length > 1) {
    // Prefer the one labelled as a member if exactly one is.
    var members = byName.filter(function (c) { return c.isMember; });
    if (members.length === 1) return { contact: members[0], method: 'name' };
    return { method: 'ambiguous', candidates: byName.map(function (c) { return c.name; }) };
  }
  return { method: 'not-found' };
}

function editDistance_(a, b) {
  var prev = [];
  for (var j = 0; j <= b.length; j++) prev[j] = j;
  for (var i = 1; i <= a.length; i++) {
    var cur = [i];
    for (var k = 1; k <= b.length; k++) {
      cur[k] = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

function nameTokens_(text) {
  var suffixes = { jr: 1, sr: 1, ii: 1, iii: 1, iv: 1 };
  // Drop apostrophes first so O'Rourke and Orourke compare equal.
  var apostrophes = new RegExp("['`" + String.fromCharCode(8217) + ']', 'g');
  return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(apostrophes, '')
    .replace(/[^a-z\s-]/g, ' ').split(/[\s-]+/)
    .filter(function (t) { return t.length > 1 && !suffixes[t]; });
}

function phoneKey_(value) {
  var digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

/** JSON.stringify with sorted keys, so key order never counts as a change. */
function stableStringify_(value) {
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify_).join(',') + ']';
  }
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().filter(function (key) { return value[key] !== undefined; }).map(function (key) {
      return JSON.stringify(key) + ':' + stableStringify_(value[key]);
    }).join(',') + '}';
  }
  return JSON.stringify(value);
}

/**
 * Returns a backed-up photo by file name so a tablet that doesn't have it
 * (another tablet took it, or the app was reinstalled) can show it.
 */
function getPhoto_(request) {
  var name = String(request.name || '').replace(/[\\/]/g, '_');
  if (!name) return { ok: false, error: 'Missing photo name' };
  var files = getPhotoFolder_().getFilesByName(name);
  if (!files.hasNext()) return { ok: false, error: 'Photo not found' };
  var blob = files.next().getBlob();
  return { ok: true, mimeType: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
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
