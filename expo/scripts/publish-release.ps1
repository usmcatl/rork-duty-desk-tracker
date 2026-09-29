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

    & $gh release view $tag *> $null
    if ($LASTEXITCODE -eq 0) { throw "Release $tag already exists. Bump version and versionCode in expo/app.json for a new release." }

    $notes = @"
Duty Desk Tracker $tag for American Legion Post 7.

**Install:** download DutyDeskTracker-$tag.apk below, open it on the tablet, allow "Install unknown apps" if asked, then tap Install. It installs over earlier versions and keeps all data.
"@
    & $gh release create $tag $apk --target main --title "Duty Desk Tracker $tag" --notes $notes
    if ($LASTEXITCODE -ne 0) { throw 'Creating the GitHub release failed' }
    Write-Host "Published: https://github.com/usmcatl/duty-desk-tracker/releases/tag/$tag"
} finally {
    Pop-Location
}
