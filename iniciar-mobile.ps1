param([string]$IpComputador)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (!$IpComputador) {
    $routes = @(Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
        Sort-Object @{ Expression = { $_.RouteMetric + $_.InterfaceMetric } })
    foreach ($route in $routes) {
        $address = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue |
            Where-Object { $_.AddressState -eq 'Preferred' -and $_.IPAddress -notmatch '^(127\.|169\.254\.)' } |
            Select-Object -First 1
        if ($address) { $IpComputador = $address.IPAddress; break }
    }
}
$parsedAddress = $null
if (![System.Net.IPAddress]::TryParse($IpComputador, [ref]$parsedAddress) -or
    $parsedAddress.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork -or
    $IpComputador -match '^(127\.|169\.254\.|0\.)' -or
    !(Get-NetIPAddress -AddressFamily IPv4 -IPAddress $IpComputador -ErrorAction SilentlyContinue)) {
    throw 'Informe o IPv4 da rede do computador: .\iniciar-mobile.ps1 -IpComputador 192.168.0.105. Consulte ipconfig.'
}

$taskNode = (Get-Command node -ErrorAction SilentlyContinue).Source
if (!$taskNode) { $taskNode = "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe" }
if (!(Test-Path $taskNode)) { throw 'Instale Node.js 22.13 ou superior com npm.' }
$nodeVersion = & $taskNode -p 'process.versions.node'
$nodeParts = $nodeVersion.Split('.')
if ([int]$nodeParts[0] -lt 22 -or ([int]$nodeParts[0] -eq 22 -and [int]$nodeParts[1] -lt 13)) {
    throw 'Use Node.js 22.13 ou superior para o mobile e seus testes locais.'
}
$env:PATH = "$(Split-Path $taskNode);$env:PATH"
$installedExpo = 'mobile/node_modules/expo/package.json'
$installRequired = !(Test-Path $installedExpo)
if (!$installRequired) {
    $installedVersion = (Get-Content $installedExpo -Raw | ConvertFrom-Json).version
    $installRequired = $installedVersion -notmatch '^54\.'
    foreach ($dependency in @(@{ Name = 'react'; Version = '19.1.0' }, @{ Name = 'react-native'; Version = '0.81.5' })) {
        $dependencyFile = "mobile/node_modules/$($dependency.Name)/package.json"
        if (!(Test-Path $dependencyFile) -or (Get-Content $dependencyFile -Raw | ConvertFrom-Json).version -ne $dependency.Version) {
            $installRequired = $true
        }
    }
}
if ($installRequired) {
    $taskNpm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($taskNpm) { & $taskNpm.Source ci --prefix mobile --no-audit --no-fund }
    elseif (Test-Path '.local/package/bin/npm-cli.js') { & $taskNode .local/package/bin/npm-cli.js ci --prefix mobile --no-audit --no-fund }
    else { throw 'Instale Node.js com npm para preparar as dependencias mobile.' }
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependencias mobile.' }
}

& "$PSScriptRoot/iniciar-studymate.ps1" -AllowMobile -ApiOnly -NoBrowser
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw 'Falha ao preparar a API.' }

$previousApiUrl = $env:EXPO_PUBLIC_API_URL
$previousPackagerHost = $env:REACT_NATIVE_PACKAGER_HOSTNAME
try {
    $env:EXPO_PUBLIC_API_URL = "http://${IpComputador}:8081/api"
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $IpComputador
    Write-Host "API para o celular: $env:EXPO_PUBLIC_API_URL"
    Write-Host 'Conecte o celular a mesma rede do computador e abra o QR Code no Expo Go da App Store (SDK 54).'
    Write-Host 'Mantenha esta janela aberta. Se precisar, permita Java e Node nas redes privadas do firewall.'
    Write-Host 'Tutorial: mobile/TESTE-NO-CELULAR.md'
    Set-Location "$PSScriptRoot/mobile"
    & $taskNode node_modules/expo/bin/cli start --go --lan --port 8082 --clear
    if ($LASTEXITCODE -ne 0) { throw 'Expo nao iniciou. Confira se a porta 8082 esta livre.' }
} finally {
    $env:EXPO_PUBLIC_API_URL = $previousApiUrl
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $previousPackagerHost
    Set-Location $PSScriptRoot
}
