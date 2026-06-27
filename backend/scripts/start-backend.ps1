$ErrorActionPreference = "Stop"

$mavenVersion = "3.9.6"
$backendRoot = Split-Path $PSScriptRoot -Parent
$mavenDir = Join-Path $backendRoot "tools\apache-maven-$mavenVersion"
$mvnCmd = Join-Path $mavenDir "bin\mvn.cmd"

if (-not (Test-Path $mvnCmd)) {
    Write-Host "Downloading Apache Maven $mavenVersion..."
    $zipUrl = "https://archive.apache.org/dist/maven/maven-3/$mavenVersion/binaries/apache-maven-$mavenVersion-bin.zip"
    $zipPath = Join-Path $env:TEMP "apache-maven-$mavenVersion-bin.zip"
    $toolsDir = Join-Path $backendRoot "tools"

    New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
    Remove-Item $zipPath -Force
}

Set-Location $backendRoot

$profile = $env:SPRING_PROFILES_ACTIVE
if (-not $profile) {
    $profile = "h2"
}

Write-Host "Starting backend with Spring profile: $profile"
if ($profile -eq "sqlserver") {
    Write-Host "SQL Server target: ${env:DB_HOST:-localhost}:${env:DB_PORT:-1433}/${env:DB_NAME:-ProjectSWP391}"
}

& $mvnCmd spring-boot:run "-Dspring-boot.run.profiles=$profile"
