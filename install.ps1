<# 
.SYNOPSIS
    Lato CLI Installer for Windows

.DESCRIPTION
    Downloads and installs the latest Lato CLI release for Windows.
    Run from PowerShell: irm https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/main/install.ps1 | iex

.PARAMETER Version
    Specific version to install (default: latest)

.PARAMETER InstallDir
    Installation directory (default: $env:USERPROFILE\.local\bin)
#>

param(
    [string]$Version = "latest",
    [string]$InstallDir = "$env:USERPROFILE\.local\bin"
)

$ErrorActionPreference = "Stop"

$REPO = "lazyarjun2005-rgb/lato-tui"

function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

function Detect-Platform {
    $arch = [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
    if ($arch -eq "AMD64" -or $arch -eq "x64") { $global:ARCH = "x64" }
    elseif ($arch -eq "ARM64") { $global:ARCH = "arm64" }
    else { Write-Error "Unsupported architecture: $arch"; exit 1 }

    $global:OS = "win32"
    Write-Info "Detected platform: $OS/$ARCH"
}

function Get-LatestVersion {
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest" -ErrorAction Stop
        return $response.tag_name.TrimStart('v')
    } catch {
        Write-Error "Failed to fetch latest version: $_"
        exit 1
    }
}

function Download-Binary {
    param([string]$Version)

    $assetName = "lato-$OS-$ARCH"
    $url = "https://github.com/$REPO/releases/download/v$Version/$assetName.zip"
    $outFile = "$env:TEMP\lato-$Version.zip"

    Write-Info "Downloading $assetName v$Version..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $outFile -ErrorAction Stop
    } catch {
        Write-Error "Failed to download from $url"
        Write-Warn "This version/platform may not have a pre-built binary yet."
        Write-Warn "Try building from source or check available releases at:"
        Write-Warn "https://github.com/$REPO/releases"
        exit 1
    }

    $global:DOWNLOAD_FILE = $outFile
}

function Extract-Binary {
    param([string]$Version)

    Write-Info "Extracting binary..."
    $extractDir = "$env:TEMP\lato-extract"
    if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
    New-Item -ItemType Directory -Path $extractDir | Out-Null

    Expand-Archive -Path $global:DOWNLOAD_FILE -DestinationPath $extractDir -Force

    $binary = Get-ChildItem $extractDir -Filter "lato*.exe" | Select-Object -First 1
    if (-not $binary) {
        Write-Error "lato.exe not found in archive"
        exit 1
    }

    if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }
    $targetPath = Join-Path $InstallDir "lato-cli.exe"
    Move-Item $binary.FullName $targetPath -Force
    $global:INSTALLED_PATH = $targetPath
}

function Verify-Install {
    if (Test-Path $global:INSTALLED_PATH) {
        try {
            $versionOutput = & $global:INSTALLED_PATH --version
            Write-Success "Installed: $versionOutput"
            return $true
        } catch {
            Write-Error "Installation verification failed: $_"
            return $false
        }
    } else {
        Write-Error "Installation verification failed - binary not found"
        return $false
    }
}

function Update-Path {
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -like "*$InstallDir*") {
        Write-Info "Install directory already in user PATH"
    } else {
        Write-Warn "Install directory $InstallDir is not in your user PATH."
        Write-Warn "Add it by running the following in PowerShell:"
        Write-Warn "  [Environment]::SetEnvironmentVariable('Path', \"$InstallDir;$currentPath\", 'User')"
        Write-Warn "Then restart your PowerShell session."
    }
}

# Main
Write-Info "Lato CLI Installer for Windows"
Write-Info "Repository: $REPO"

Detect-Platform

if ($Version -eq "latest") {
    $Version = Get-LatestVersion
    Write-Info "Latest version: $Version"
}

Download-Binary $Version
Extract-Binary $Version

if (Verify-Install) {
    Update-Path
    Write-Success "Installation complete! Run 'lato-cli' to start."
    Write-Info "If 'lato-cli' is not found, restart your PowerShell or run: \$env:Path += \";$InstallDir\""
} else {
    exit 1
}