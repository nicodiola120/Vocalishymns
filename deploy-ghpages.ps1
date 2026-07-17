$ErrorActionPreference = "Stop"

$projectDir = "C:\Users\Domz\Downloads\New folder (13) - Copy"
Set-Location $projectDir

# 1. Build
Write-Host "[1/4] Building..." -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# 2. Create version.json in dist/
$pkg = Get-Content "package.json" | ConvertFrom-Json
$version = $pkg.version
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$bundleId = "vocalis-$version-$timestamp"
$zipName = "$bundleId.zip"

Write-Host "[2/4] Creating bundle $zipName..." -ForegroundColor Cyan

# Create ZIP outside dist
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tempZip = Join-Path $env:TEMP $zipName
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    (Resolve-Path "dist").Path,
    $tempZip,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
)

# Write version.json
$manifest = @"
{
  "version": "$version",
  "bundleId": "$bundleId",
  "bundleUrl": "https://nicodiola120.github.io/vocalis/$zipName",
  "timestamp": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')"
}
"@
Set-Content -Path "dist\version.json" -Value $manifest -Encoding utf8
Write-Host "  version.json written" -ForegroundColor Gray

# 3. Clone gh-pages, replace content, push
Write-Host "[3/4] Deploying to GitHub Pages..." -ForegroundColor Cyan
$tempDir = Join-Path $env:TEMP "vocalis-ghpages-deploy"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }

# Clone the existing gh-pages branch
git clone --branch gh-pages "https://github.com/nicodiola120/vocalis.git" $tempDir

# Remove all old files
Get-ChildItem $tempDir -Exclude ".git" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copy dist/ contents (including version.json)
Copy-Item "dist\*" -Destination $tempDir -Recurse -Force

# Copy the ZIP bundle
Copy-Item $tempZip -Destination $tempDir -Force

Set-Location $tempDir
git config user.email "domz@vocalis.app"
git config user.name "Vocalis CI"
git add -A
git commit -m "Deploy v$version ($bundleId)"
git push origin gh-pages

Write-Host "[4/4] Done!" -ForegroundColor Green
Write-Host "  Version:  $version"
Write-Host "  Bundle:   https://nicodiola120.github.io/vocalis/$zipName"
Write-Host "  Manifest: https://nicodiola120.github.io/vocalis/version.json"

Set-Location $projectDir
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
