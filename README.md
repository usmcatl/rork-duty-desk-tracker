# Duty Desk Tracker

A standalone Android app for the Duty Desk at American Legion Post 7, Lake Chapala. It tracks:

- **Packages**: arrivals (with package, label, and storage-location photos) and member pickups
- **Equipment**: check-out, deposits, due dates, lease renewals, overdue alerts, and returns
- **Members**: the roster from the Post's Google Contacts, with Active/Inactive status (only Active
  members can check out equipment; packages for others show a warning), profiles, and associated
  members
- **Shifts**: tablet changeover and duty-officer handover history

Everything is stored on the device, and the app works with no internet connection. It has no
server and no Expo, Rork, or other third-party service to depend on. Syncing to a Google Sheet
(for backup and sharing data between tablets) is optional; see
[google-sheets-sync/README.md](google-sheets-sync/README.md).

**Download the app:** get the `.apk` file from the
[latest release](https://github.com/usmcatl/duty-desk-tracker/releases/latest), then see
[Install on a tablet](#install-on-a-tablet).

## Project layout

```
expo/                 The app (Expo / React Native, TypeScript)
  app/                Screens (expo-router file-based routes)
  components/         Shared UI components
  store/              Data stores (zustand, saved on-device with AsyncStorage)
  store/syncStore.ts  Google Sheets sync engine
  scripts/            build-apk.ps1: local APK build
google-sheets-sync/   Apps Script to paste into the Google Sheet + setup guide
releases/             Locally built APKs (not committed; published as GitHub Releases)
```

## One-time PC setup (Windows)

```powershell
winget install OpenJS.NodeJS.LTS
winget install Microsoft.OpenJDK.17
```

Plus the Android SDK command-line tools, unzipped to
`%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest`, with these packages installed:

```powershell
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

Then install the app's dependencies:

```powershell
cd expo
npm install
```

## Build the APK

```powershell
cd expo
npm run build:apk
```

The APK is written to `releases\DutyDeskTracker-v<version>.apk`. The first build takes 20–40
minutes; later builds are much faster.

## Publish a release

After building, with all changes committed and pushed:

```powershell
cd expo
npm run release
```

This creates a GitHub Release tagged `v<version>` with the APK attached, which becomes the
[latest release](https://github.com/usmcatl/duty-desk-tracker/releases/latest) download. It needs
the GitHub CLI (`winget install GitHub.cli`), signed in once with `gh auth login`.

Tablets update themselves from that release: **Settings → App Updates → Check for Updates**
downloads the new APK and opens Android's installer (data and sync settings are kept). The first
time, Android asks to allow installing apps from Duty Desk Tracker. The repository must stay public
for this to work without credentials.

**Release checklist:** bump `version` and `android.versionCode` in `expo/app.json`, commit and push,
`npm run build:apk`, then `npm run release`.

Before building a new version for tablets that already have the app, bump `version` and
`android.versionCode` in `expo/app.json`. Android only installs an update over the old app when
the versionCode is higher.

## Install on a tablet

1. Copy the APK to the tablet (USB cable, Google Drive, or email).
2. Open it on the tablet. If prompted, allow **Install unknown apps** for the app you opened it
   from (Files, Drive, etc.).
3. Tap **Install**.

Or, with the tablet connected by USB and USB debugging on:
`%LOCALAPPDATA%\Android\Sdk\platform-tools\adb install -r releases\DutyDeskTracker-v1.0.0.apk`

## Development

```powershell
cd expo
npm run typecheck     # TypeScript check
npm run web           # quick UI preview in a browser
npm run android       # run on a connected device/emulator with live reload
```

## Backups

- **Google Sheets sync** (recommended): continuous, automatic backup of all records, plus photo
  backup to Drive.

## Support

Created by James Turner for Duty Desk Officers at American Legion Post No. 7, Lake Chapala.
