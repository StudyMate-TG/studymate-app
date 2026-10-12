$ErrorActionPreference = 'Stop'
foreach ($name in @('frontend', 'backend')) {
    $pidFile = Join-Path $PSScriptRoot ".local/$name.pid"
    if (Test-Path $pidFile) {
        $saved = Get-Content $pidFile | ConvertFrom-Json
        $process = Get-Process -Id $saved.id -ErrorAction SilentlyContinue
        if ($process -and $process.StartTime.ToUniversalTime().Ticks.ToString() -eq $saved.started) {
            Stop-Process -Id $process.Id
        }
        Remove-Item -LiteralPath $pidFile
    }
}
Write-Host 'StudyMate encerrado. Os dados locais foram preservados.'
