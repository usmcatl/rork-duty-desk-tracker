# Publishes the built APK as a GitHub Release (tag v<version>) on usmcatl/duty-desk-tracker.
# Usage (from the expo folder, after `npm run build:apk`):  npm run release
# Requires the GitHub CLI, signed in once with:  gh auth login

$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $projectDir

$gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
if (-not $gh) { $gh = 'C:\Program Files\GitHub CLI\gh.exe' }
if (-not (Test-Path $gh)) { throw 'GitHub CLI not found. Install it with: winget install GitHub.cli' }

$version = (Get-Content (Join-Path $projectDir 'app.json') -Raw | ConvertFrom-Json).expo.version
$tag = "v$version"
$apk = Join-Path $repoRoot "releases\DutyDeskTracker-v$version.apk"
if (-not (Test-Path $apk)) { throw "APK not found: $apk. Run npm run build:apk first." }

Push-Location $repoRoot
try {
    if (git status --porcelain) { throw 'You have uncommitted changes. Commit and push them first so the release matches the code.' }
    git fetch -q origin
    if ((git rev-parse HEAD) -ne (git rev-parse origin/main)) { throw 'Local main is not in sync with GitHub. Push (or pull) first.' }

    # "release not found" on stderr is the normal case here, so don't let it stop the script.
    $ErrorActionPreference = 'Continue'
    & $gh release view $tag *> $null
    $exists = $LASTEXITCODE -eq 0
    $ErrorActionPreference = 'Stop'
    if ($exists) { throw "Release $tag already exists. Bump version and versionCode in expo/app.json for a new release." }

    $notes = @"
Duty Desk Tracker $tag for American Legion Post 7.

**Update a tablet:** Settings > App Updates > Check for Updates.

**First install:** download DutyDeskTracker-$tag.apk below, open it on the tablet, allow installing unknown apps if asked, then tap Install. It installs over earlier versions and keeps all data.
"@
    # Pass notes via a file: Windows PowerShell mangles quotes in native command arguments.
    $notesFile = Join-Path $env:TEMP "dutydesk-release-notes.md"
    Set-Content -Path $notesFile -Value $notes -Encoding UTF8
    try {
        $ErrorActionPreference = 'Continue'
        & $gh release create $tag $apk --target main --title "Duty Desk Tracker $tag" --notes-file $notesFile
        $created = $LASTEXITCODE -eq 0
        $ErrorActionPreference = 'Stop'
    } finally {
        Remove-Item $notesFile -ErrorAction SilentlyContinue
    }
    if (-not $created) { throw 'Creating the GitHub release failed (see the gh message above)' }
    Write-Host "Published: https://github.com/usmcatl/duty-desk-tracker/releases/tag/$tag"
} finally {
    Pop-Location
}
