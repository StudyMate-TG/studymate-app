$ErrorActionPreference = 'Stop'
$taskNode = (Get-Command node -ErrorAction SilentlyContinue).Source
if (!$taskNode) { $taskNode = "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe" }
if (!(Test-Path $taskNode)) { throw 'Instale Node.js 22.13 ou superior.' }
if (!(Test-Path "$PSScriptRoot/mobile/node_modules/expo/bin/cli")) { throw 'Execute iniciar-mobile.cmd para preparar as dependencias.' }

Write-Host 'Entre no navegador com a MESMA conta Expo usada no iPhone.'
Write-Host 'A conta Expo e gratuita e diferente da conta de teste do StudyMate.'
$taskProcess = New-Object System.Diagnostics.Process
$taskProcess.StartInfo.FileName = $taskNode
$taskProcess.StartInfo.Arguments = 'node_modules/expo/bin/cli login --browser'
$taskProcess.StartInfo.WorkingDirectory = "$PSScriptRoot/mobile"
$taskProcess.StartInfo.UseShellExecute = $false
$taskProcess.StartInfo.CreateNoWindow = $true
$taskProcess.StartInfo.RedirectStandardOutput = $true
$taskProcess.StartInfo.RedirectStandardError = $true
# Open the URL directly in Windows instead of the CLI's cmd/start launcher.
$taskProcess.StartInfo.EnvironmentVariables['BROWSER'] = 'none'
$taskStarted = $false
try {
    $taskStarted = $taskProcess.Start()
    if (!$taskStarted) { throw 'Nao foi possivel iniciar o login Expo.' }
    $taskErrors = $taskProcess.StandardError.ReadToEndAsync()
    while ($true) {
        $taskRead = $taskProcess.StandardOutput.ReadLineAsync()
        while (!$taskRead.IsCompleted) { Start-Sleep -Milliseconds 100 }
        $taskLine = $taskRead.Result
        if ($null -eq $taskLine) { break }
        if ($taskLine -match '(https://expo\.dev/login\?\S+)') {
            $taskLoginUrl = $Matches[1]
            $taskUri = [System.Uri]$taskLoginUrl
            if ($taskUri.Scheme -ne 'https' -or $taskUri.Host -ne 'expo.dev') { throw 'Endereco de login Expo inesperado.' }
            Write-Host 'Abrindo o login oficial do Expo no navegador...'
            try { Start-Process -FilePath $taskLoginUrl }
            catch { Write-Host 'Abra este endereco no navegador deste computador:'; Write-Host $taskLoginUrl }
        } else {
            Write-Host $taskLine
        }
    }
    $taskProcess.WaitForExit()
    $taskErrorText = $taskErrors.Result
    if ($taskProcess.ExitCode -ne 0) {
        if ($taskErrorText) { Write-Host $taskErrorText }
        throw 'O login Expo nao foi concluido. Execute entrar-expo.cmd novamente.'
    }
    Write-Host 'Login concluido. No iPhone, entre na mesma conta Expo e toque em Try again.'
} finally {
    if ($taskStarted -and !$taskProcess.HasExited) { $taskProcess.Kill(); $taskProcess.WaitForExit() }
    $taskProcess.Dispose()
}
