# Google Sheets Sync — Setup

Duty Desk Tracker stores everything on the tablet and works fully offline. Optionally, each
tablet can sync to one shared Google Sheet for safekeeping and so several devices see the same
data. Photos are backed up to a Google Drive folder.

Setup takes about 10 minutes and is done once, by whoever owns the Post's Google account.

## 1. Create the Sheet and add the script

1. Signed in to the Post's Google account, go to <https://sheets.new> to create a blank sheet.
   Name it something like **Post 7 Duty Desk Data**.
2. In the sheet, open **Extensions → Apps Script**.
3. Delete the sample code in `Code.gs`, then paste the full contents of
   [`Code.gs`](Code.gs) from this folder. Click **Save** (disk icon).

## 2. Run setup once

1. In the function dropdown at the top of the editor, choose **setup**, then click **Run**.
2. Google asks you to authorize the script. Choose the Post account, click **Advanced →
   Go to (project name)**, and **Allow**. (The warning appears because it is your own
   unpublished script.)
3. Open **Execution log** at the bottom. Copy the **sync token** it prints. You will type it
   into each tablet. Keep it private: anyone with the URL *and* token can read and change the data.

The sheet now has tabs: Members, Equipment, Checkouts, Packages, Shifts, Settings, and your Drive
has a **Duty Desk Tracker Photos** folder.

## 3. Deploy as a web app

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, and copy the **Web app URL** (it ends in `/exec`).

"Anyone" is required so the tablets can reach it without signing in to Google; the sync token is
what protects the data.

## 4. Connect each tablet

In the app: **Settings → Google Sheets Sync**. Paste the Web app URL and the sync token, then tap
**Connect**. The first sync uploads everything on that tablet. After that the app syncs by itself:
at launch, shortly after any change, when reopened, and every 5 minutes while open. With no
internet it just keeps working and catches up later.

## Good to know

- **The app is the source of truth.** The readable columns in the sheet are for browsing,
  filtering, and printing. Editing them does not change anything in the app. The `json` column is
  what the app reads, so don't edit it.
- **Deleted records** stay in the sheet with `deleted = TRUE` as an audit trail.
- **If two tablets edit the same record** between syncs, the one that syncs last wins.
- **Photos** are backed up to Drive but not shown on other tablets. A package logged on tablet A
  shows its photos on tablet A. The originals are in the Drive folder.
- **"Clear All Data"** in Settings only clears the tablet. With sync on, the data downloads again
  on the next sync.
- **If you change `Code.gs` later**, use **Deploy → Manage deployments → Edit → Version: New
  version**. That keeps the same URL, so the tablets don't need re-connecting.
