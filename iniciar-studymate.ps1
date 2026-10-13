param([switch]$NoBrowser, [switch]$AllowMobile, [switch]$ApiOnly)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$state = Join-Path $PSScriptRoot '.local'
New-Item -ItemType Directory -Force $state | Out-Null

# Locate a full JDK, including installations not present on PATH.
$candidates = @($env:JAVA_HOME)
$candidates += @(Get-ChildItem 'C:/Program Files/Eclipse Adoptium','C:/Program Files/Java',"$env:USERPROFILE/.jdks" -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
$jdk = $null
foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path "$candidate/bin/javac.exe")) {
        $version = & "$candidate/bin/javac.exe" -version 2>&1
        if ("$version" -match 'javac (\d+)' -and [int]$Matches[1] -ge 17) { $jdk = $candidate; break }
    }
}
if (!$jdk) { throw 'Instale um JDK 17 ou superior e configure JAVA_HOME.' }
$env:JAVA_HOME = $jdk
$env:MAVEN_USER_HOME = Join-Path $state 'maven'
if (!$ApiOnly) {
    $node = (Get-Command node -ErrorAction SilentlyContinue).Source
    if (!$node) {
        $node = "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"
    }
    if (!(Test-Path $node)) { throw 'Instale Node.js 20 ou superior.' }
    $env:PATH = "$(Split-Path $node);$env:PATH"
}

function Test-Listening($port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try { $client.Connect('127.0.0.1', $port); return $true }
    catch { return $false }
    finally { $client.Dispose() }
}
function Get-ServiceListeners($port) {
    try {
        $connections = @(Get-NetTCPConnection -ErrorAction Stop)
    } catch {
        throw "Nao foi possivel verificar o processo da porta $port. Nenhum servico foi encerrado."
    }
    return @($connections | Where-Object { $_.LocalPort -eq $port -and $_.State -eq 'Listen' })
}
function Get-OwnedServiceProcess($name, $port, $listeners) {
    $pidFile = Join-Path $state "$name.pid"
    $saved = if (Test-Path -LiteralPath $pidFile) { Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json } else { $null }
    $existing = if ($saved) { Get-Process -Id $saved.id -ErrorAction SilentlyContinue } else { $null }
    if (!$existing -or $existing.StartTime.ToUniversalTime().Ticks.ToString() -ne $saved.started -or
            @($listeners | Where-Object { $_.OwningProcess -ne $existing.Id }).Count -gt 0) {
        throw "A porta $port esta ocupada por outro processo. Feche-o e tente novamente."
    }
    return $existing
}
function Start-ServiceProcess($name, $exe, $arguments, $directory, $port) {
    $pidFile = Join-Path $state "$name.pid"
    $listeners = @(Get-ServiceListeners $port)
    if ($listeners.Count) {
        $existing = Get-OwnedServiceProcess $name $port $listeners
        return
    }
    $process = Start-Process -FilePath $exe -ArgumentList $arguments -WorkingDirectory $directory -WindowStyle Hidden -PassThru -RedirectStandardOutput "$state/$name.log" -RedirectStandardError "$state/$name-error.log"
    @{ id = $process.Id; started = $process.StartTime.ToUniversalTime().Ticks.ToString() } | ConvertTo-Json | Set-Content $pidFile
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        if ($process.HasExited) { throw "Falha ao iniciar $name. Consulte .local/$name.log e .local/$name-error.log." }
        if (Test-Listening $port) {
            $listeners = @(Get-ServiceListeners $port)
            $existing = Get-OwnedServiceProcess $name $port $listeners
            return
        }
        Start-Sleep -Seconds 1
    }
    throw "Tempo de inicializacao excedido. Consulte .local/$name.log."
}

if (!$ApiOnly -and !(Test-Path 'frontend/node_modules/vite/bin/vite.js')) {
    Write-Host 'Instalando dependencias da interface...'
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($npm) { & $npm.Source ci --prefix frontend --no-audit --no-fund }
    elseif (Test-Path '.local/package/bin/npm-cli.js') { & $node .local/package/bin/npm-cli.js ci --prefix frontend --no-audit --no-fund }
    else { throw 'Instale o Node.js com npm para instalar as dependencias.' }
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependencias.' }
}
$bindAddress = if ($AllowMobile) { '0.0.0.0' } else { '127.0.0.1' }
$expectedAddresses = if ($AllowMobile) { @('0.0.0.0', '::') } else { @('127.0.0.1', '::1') }
$backendListeners = @(Get-ServiceListeners 8081)
if ($backendListeners.Count) {
    $backendProcess = Get-OwnedServiceProcess 'backend' 8081 $backendListeners
    if (@($backendListeners | Where-Object { $_.LocalAddress -notin $expectedAddresses }).Count) {
        Write-Host 'Reiniciando a API para ajustar o acesso de rede...'
        Stop-Process -Id $backendProcess.Id
        if (!$backendProcess.WaitForExit(10000)) { throw 'A API nao encerrou. O pacote em uso nao sera substituido.' }
        Remove-Item -LiteralPath (Join-Path $state 'backend.pid')
        $backendListeners = @(Get-ServiceListeners 8081)
        if ($backendListeners.Count) { throw 'A porta 8081 foi ocupada por outro processo apos encerrar a API.' }
    }
}
if (!$backendListeners.Count) {
    $backendPidFile = Join-Path $state 'backend.pid'
    $savedBackend = if (Test-Path -LiteralPath $backendPidFile) { Get-Content -LiteralPath $backendPidFile -Raw | ConvertFrom-Json } else { $null }
    $startingBackend = if ($savedBackend) { Get-Process -Id $savedBackend.id -ErrorAction SilentlyContinue } else { $null }
    if ($startingBackend -and $startingBackend.StartTime.ToUniversalTime().Ticks.ToString() -eq $savedBackend.started) {
        throw 'A API registrada ainda esta em execucao, mas nao escuta na porta 8081. Aguarde a inicializacao ou encerre-a antes de compilar.'
    }
    Write-Host 'Preparando a API (a primeira execucao pode demorar)...'
    & ./backend/mvnw.cmd -f backend/pom.xml "-Dmaven.repo.local=$state/repository" -DskipTests package -q
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar a API.' }
}
$secretFile = Join-Path $state 'jwt-secret.txt'
if (!(Test-Path $secretFile)) {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    [Convert]::ToBase64String($bytes) | Set-Content $secretFile
}
$env:JWT_SECRET = (Get-Content $secretFile -Raw).Trim()
Start-ServiceProcess 'backend' "$jdk/bin/java.exe" "-jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=local --server.address=$bindAddress" "$PSScriptRoot/backend" 8081
if ($ApiOnly) {
    $apiHost = '127.0.0.1'
    if ($AllowMobile) {
        $network = Get-NetIPConfiguration -ErrorAction SilentlyContinue |
            Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address } | Select-Object -First 1
        $apiHost = if ($network) { @($network.IPv4Address.IPAddress)[0] } else { '<IP-do-PC>' }
    }
    Write-Host "API: http://${apiHost}:8081/api"
    Write-Host 'E-mail: teste@studymate.local | Senha: StudyMate123!'
    return
}
Start-ServiceProcess 'frontend' $node 'node_modules/vite/bin/vite.js --host 127.0.0.1 --port 8080 --strictPort' "$PSScriptRoot/frontend" 8080
Write-Host 'StudyMate: http://localhost:8080/'
Write-Host 'E-mail: teste@studymate.local | Senha: StudyMate123!'
Write-Host 'Para encerrar, execute parar-studymate.cmd.'
if (!$NoBrowser) { Start-Process 'http://localhost:8080/' }
