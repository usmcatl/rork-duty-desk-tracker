# Google Sheets Sync — Setup

Duty Desk Tracker stores everything on the tablet and works fully offline. Optionally, each
tablet can sync to one shared Google Sheet for safekeeping and so several devices see the same
data. Photos are backed up to a Google Drive folder, and the member roster comes from the Post's
Google Contacts (see [Members come from Google Contacts](#members-come-from-google-contacts)).

Setup takes about 10 minutes and is done once, by whoever owns the Post's Google account.

## 1. Create the Sheet and add the script

1. Signed in to the Post's Google account, go to <https://sheets.new> to create a blank sheet.
   Name it something like **Post 7 Duty Desk Data**.
2. In the sheet, open **Extensions → Apps Script**.
3. Delete the sample code in `Code.gs`, then paste the full contents of
   [`Code.gs`](Code.gs) from this folder. Click **Save** (disk icon).
4. In the left sidebar, click **Services +**, choose **People API**, and click **Add**. The
   script uses it to read the membership roster from the Post's Google Contacts.

## 2. Run setup once

1. In the function dropdown at the top of the editor, choose **setup**, then click **Run**.
2. Google asks you to authorize the script. Choose the Post account, click **Advanced →
   Go to (project name)**, and **Allow**. (The warning appears because it is your own
   unpublished script.)
3. Open **Execution log** at the bottom. It shows how many members were read from Contacts,
   then the **sync token**. Copy the token. You will type it
   into each tablet. Keep it private: anyone with the URL *and* token can read and change the data.

The sheet now has tabs: Members, Equipment, Checkouts, Packages, Shifts, Settings, and your Drive
has a **Duty Desk Tracker Photos** folder. Setup also schedules the daily contacts sync (around
3 AM). Running setup again is safe: it keeps the same token and never schedules a second copy.

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

## Members come from Google Contacts

The contacts of americanlegionchapala@gmail.com are the master membership roster. The app is
where everyone looks members up; Contacts is where membership is maintained.

- **Who is a member:** any contact with a year label (`2026 Renewed`, `2027 New Member`, ...) or
  the **PUFL** label. Contacts with neither (vendors, volunteers only) are not in the app.
- **Active:** a label for the current year or later, or PUFL. Only Active members can check out
  equipment. Packages can be logged for anyone, but the app warns when a membership isn't current.
- **Inactive:** only past-year labels. **Deceased:** a `Deceased` label.
- **Group:** General Membership: Legion; Auxiliary / ALA: Auxiliary; SAL: Sons of the American
  Legion. Supporters are treated as members under the same year rules.
- **Updates:** the script re-reads Contacts every day, so renewals and lapses reach every tablet
  automatically. To pick up a change sooner, run **syncMembersFromContacts** in the editor, then
  tap **Sync Now** on the tablet.
- **Member IDs:** read from a `Member ID: 12345` line in the contact's notes. When a duty officer
  sets or changes a member ID in the app, it is written back to that line in the contact.
- **Removing someone:** change their labels in Contacts. A contact that loses all membership
  labels (or is deleted) stays in the app as Inactive, because packages and checkouts may refer to
  them. Status changes made in the app are replaced by the next daily contacts sync.

## Good to know

- **The app is the source of truth** for packages, equipment, and shifts. The readable columns in the sheet are for browsing,
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
