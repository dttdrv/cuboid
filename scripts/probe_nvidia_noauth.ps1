$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Probe([string]$url) {
  Write-Host ""
  Write-Host ("probe {0}" -f $url)
  try {
    $r = Invoke-WebRequest -Uri $url -Method Post -Body '{}' -ContentType "application/json"
    Write-Host ("status {0}" -f $r.StatusCode)
    Write-Host ($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))
  } catch {
    $msg = $_.Exception.Message
    Write-Host ("error: {0}" -f $msg)
  }
}

Probe "https://integrate.api.nvidia.com/v1/chat/completions"
Probe "https://integrate.api.nvidia.com/chat/completions"
Probe "https://api.nvidia.com/v1/chat/completions"
Write-Host ""
Write-Host "probe https://integrate.api.nvidia.com/v1/models (GET)"
try {
  $r = Invoke-WebRequest -Uri "https://integrate.api.nvidia.com/v1/models" -Method Get
  Write-Host ("status {0}" -f $r.StatusCode)
  Write-Host ($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))
} catch {
  Write-Host ("error: {0}" -f $_.Exception.Message)
}
