$ErrorActionPreference = "Stop"

$tempDir = "$env:TEMP\Vocalishymns-ghpages-fix"
$distDir = "C:\Users\Domz\Downloads\New folder (13) - Copy\dist"

if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Set-Location $tempDir
git init
git checkout --orphan gh-pages

# Copy only dist/ contents
Copy-Item "$distDir\*" -Destination $tempDir -Recurse -Force

git add -A
git commit -m "Deploy v1.0.0"
git remote add origin https://github.com/nicodiola120/Vocalishymns.git
git push -f origin gh-pages

Set-Location "C:\Users\Domz\Downloads\New folder (13) - Copy"
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "gh-pages deployed!" -ForegroundColor Green
Write-Host "URL: https://nicodiola120.github.io/Vocalishymns/version.json"
