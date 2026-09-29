# Builds a standalone release APK for Duty Desk Tracker entirely on this PC.
# Usage (from the expo folder):  npm run build:apk
# Output: ..\releases\DutyDeskTracker-v<version>.apk (publish with: npm run release)

$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot

# Locate Java 17 and the Android SDK if they aren't already configured.
if (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
    $jdk = Get-ChildItem 'C:\Program Files\Microsoft' -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $jdk) { throw 'JDK 17 not found. Install it with: winget install Microsoft.OpenJDK.17' }
    $env:JAVA_HOME = $jdk.FullName
}
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
if (-not (Test-Path $env:ANDROID_HOME)) { throw "Android SDK not found at $env:ANDROID_HOME" }
$env:Path = "$env:JAVA_HOME\bin;C:\Program Files\nodejs;$env:Path"
$env:CI = '1'

# The native C++ build creates paths longer than Windows' 260-character limit
# when the project sits in a deep folder. Building through a temporary drive
# letter mapped to the project keeps every path short.
$driveLetter = @('W','V','U','T','S','R','Q','P') | Where-Object { -not (Test-Path "$($_):\") } | Select-Object -First 1
if (-not $driveLetter) { throw 'No free drive letter available for the build' }
subst "$($driveLetter):" $projectDir
if ($LASTEXITCODE -ne 0) { throw "Could not map drive $($driveLetter): to the project" }
$buildDir = "$($driveLetter):\"

Push-Location $buildDir
try {
    $version = (Get-Content app.json -Raw | ConvertFrom-Json).expo.version

    Write-Host "Generating native Android project..."
    npx expo prebuild --platform android --clean
    if ($LASTEXITCODE -ne 0) { throw 'expo prebuild failed' }

    Write-Host "Compiling release APK (first build takes a while)..."
    Push-Location android
    try {
        # Real tablets and phones are ARM; skipping emulator (x86) builds halves build time.
        .\gradlew.bat assembleRelease '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a'
        if ($LASTEXITCODE -ne 0) { throw 'Gradle build failed' }
    } finally {
        # Gradle leaves a background daemon running for up to 3 hours after a
        # build; stop it so no java.exe lingers and the build drive can unmap.
        .\gradlew.bat --stop | Out-Null
        Pop-Location
    }

    # releases\ is not committed; publish the APK with `npm run release`.
    $releases = Join-Path (Split-Path -Parent $projectDir) 'releases'
    New-Item -ItemType Directory -Force $releases | Out-Null
    $apk = Join-Path $releases "DutyDeskTracker-v$version.apk"
    Copy-Item 'android\app\build\outputs\apk\release\app-release.apk' $apk -Force
    Write-Host "APK ready: $apk"
} finally {
    Pop-Location
    subst "$($driveLetter):" /D | Out-Null
}
