$ErrorActionPreference = 'Stop'
$env:JAVA_HOME = Join-Path $env:USERPROFILE '.jdks\ms-17.0.20.1'
if (-not (Test-Path "$env:JAVA_HOME\bin\java.exe")) { throw "JDK 17 nao encontrado em $env:JAVA_HOME" }
$env:SPRING_CONFIG_ADDITIONAL_LOCATION = 'file:./backend.local.properties'
Push-Location $PSScriptRoot
try { & .\mvnw.cmd spring-boot:run } finally { Pop-Location }
