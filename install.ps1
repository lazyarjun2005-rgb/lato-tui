<#
.SYNOPSIS
    Lato CLI installer for Windows developer-preview releases.

.EXAMPLE
    .\install.ps1 -Version 0.1.0-preview.1
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Version,
    [string]$InstallDir = "$env:USERPROFILE\.local\bin"
)

$ErrorActionPreference = "Stop"
$Repo = "lazyarjun2005-rgb/lato-tui"
$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("lato-cli-" + [guid]::NewGuid().ToString("N"))
$TemporaryTarget = $null
if ($Version -notmatch '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$') { throw "Lato installer: invalid version '$Version'" }

function Fail([string]$Message) {
    throw "Lato installer: $Message"
}

function Test-Avx2 {
    if ($script:Arch -ne "x64") { return $true }
    try {
        $signature = '[DllImport("kernel32.dll")] public static extern bool IsProcessorFeaturePresent(int feature);'
        $type = Add-Type -MemberDefinition $signature -Name LatoKernel32 -Namespace LatoWin32 -PassThru
        return [bool]$type::IsProcessorFeaturePresent(40)
    } catch {
        return $false
    }
}

function Get-Target {
    $nativeArch = [Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITEW6432")
    if (-not $nativeArch) { $nativeArch = [Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE") }
    if ($nativeArch -in @("AMD64", "x64")) { $script:Arch = "x64" }
    elseif ($nativeArch -eq "ARM64") { $script:Arch = "arm64" }
    else { Fail "unsupported architecture '$nativeArch'; Lato supports x64 and arm64" }
    $suffix = if ($script:Arch -eq "x64" -and -not (Test-Avx2)) { "-baseline" } else { "" }
    return "lato-windows-$($script:Arch)$suffix"
}

function Get-Checksum([string]$Manifest, [string]$Name) {
    $matches = @(Get-Content -LiteralPath $Manifest | Where-Object {
        $parts = $_ -split '\s+', 2
        $parts.Count -eq 2 -and $parts[1] -eq $Name
    })
    if ($matches.Count -ne 1) { Fail "SHA256SUMS has no unique entry for $Name" }
    return (($matches[0] -split '\s+', 2)[0]).ToLowerInvariant()
}

function Test-Archive([string]$Archive, [string]$Expected) {
    $extract = Join-Path $TempDir "archive"
    Expand-Archive -LiteralPath $Archive -DestinationPath $extract -Force
    $files = @(Get-ChildItem -LiteralPath $extract -File -Recurse)
    if ($files.Count -ne 1 -or $files[0].Name -ne $Expected -or $files[0].DirectoryName -ne $extract) {
        Fail "archive must contain only root-level $Expected"
    }
    return $files[0].FullName
}

try {
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    $target = Get-Target
    $archiveName = "$target.zip"
    $baseUrl = "https://github.com/$Repo/releases/download/v$Version"
    $archive = Join-Path $TempDir $archiveName
    $manifest = Join-Path $TempDir "SHA256SUMS"

    Write-Host "Lato target: $target"
    Write-Host "Downloading explicit release $Version"
    Invoke-WebRequest -Uri "$baseUrl/$archiveName" -OutFile $archive
    Invoke-WebRequest -Uri "$baseUrl/SHA256SUMS" -OutFile $manifest

    $expected = Get-Checksum $manifest $archiveName
    $actual = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $expected) { Fail "SHA-256 verification failed for $archiveName" }

    $binary = Test-Archive $archive "lato.exe"
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    $TemporaryTarget = Join-Path $InstallDir (".lato-cli.$([guid]::NewGuid().ToString('N')).tmp")
    Copy-Item -LiteralPath $binary -Destination $TemporaryTarget
    Move-Item -LiteralPath $TemporaryTarget -Destination (Join-Path $InstallDir "lato-cli.exe") -Force
    $TemporaryTarget = $null

    $installed = Join-Path $InstallDir "lato-cli.exe"
    & $installed --version
    Write-Host "Installed $installed"
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if (($userPath -split ';') -contains $InstallDir) {
        Write-Host "$InstallDir is already on the user PATH"
    } else {
        Write-Host "Add $InstallDir to the user PATH, then open a new terminal"
    }
    Write-Warning "Developer-preview binaries are currently unsigned."
} finally {
    if ($TemporaryTarget -and (Test-Path -LiteralPath $TemporaryTarget)) { Remove-Item -LiteralPath $TemporaryTarget -Force }
    if (Test-Path -LiteralPath $TempDir) { Remove-Item -LiteralPath $TempDir -Recurse -Force }
}
