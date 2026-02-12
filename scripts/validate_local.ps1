$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$repo = "C:\Users\deyan\Projects\Cuboid"
$node = Join-Path $repo ".agent\tools\node-v20.11.1-win-x64\node.exe"
$backend = Join-Path $repo "backend\dist\server.js"
$port = 4317
$base = "http://127.0.0.1:$port/v1"

if (-not (Test-Path $node)) { throw "node not found at $node" }
if (-not (Test-Path $backend)) { throw "backend dist not found at $backend (run build:backend first)" }

function Invoke-ApiJson([string]$method, [string]$path, $body = $null) {
  $uri = "$base$path"
  if ($null -eq $body) {
    return Invoke-RestMethod -Method $method -Uri $uri
  }
  return Invoke-RestMethod -Method $method -Uri $uri -ContentType "application/json" -Body ($body | ConvertTo-Json -Depth 8)
}

Write-Host "starting backend on $base"

$existing = $null
try {
  $existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
} catch {
  $existing = $null
}
if ($existing) {
  $pids = $existing | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $pids) {
    try { Stop-Process -Id $procId -Force | Out-Null } catch {}
  }
  Start-Sleep -Milliseconds 200
}

$proc = Start-Process -FilePath $node -ArgumentList @($backend) -WorkingDirectory $repo -PassThru -WindowStyle Hidden
try {
  $deadline = (Get-Date).AddSeconds(10)
  $ok = $false
  while ((Get-Date) -lt $deadline) {
    try {
      $health = Invoke-ApiJson -method GET -path "/health"
      if ($health.status -eq "ok") { $ok = $true; break }
    } catch {
      Start-Sleep -Milliseconds 200
    }
  }
  if (-not $ok) { throw "backend health did not become ready in time" }

  $settings = Invoke-ApiJson -method GET -path "/settings"
  Write-Host ("settings: aiEnabled={0} aiProvider={1} hasAiApiKey={2}" -f $settings.aiEnabled, $settings.aiProvider, $settings.hasAiApiKey)

  $settingsOff = Invoke-ApiJson -method PUT -path "/settings/ai-toggle" -body @{ enabled = $false }
  if ($settingsOff.aiEnabled -ne $false) { throw "expected aiEnabled=false after toggle" }
  Write-Host "ai toggle off: ok"

  $aiBlocked = $false
  try {
    Invoke-ApiJson -method POST -path "/ai/chat" -body @{ messages = @(@{ role="user"; content="ping" }) } | Out-Null
  } catch {
    if ($_.Exception.Message -match "403") { $aiBlocked = $true }
  }
  if (-not $aiBlocked) { throw "expected /v1/ai/chat to be blocked with 403 when AI is off" }
  Write-Host "ai policy gate: ok"

  $project = Invoke-ApiJson -method POST -path "/projects" -body @{ name = "validation project" }
  if (-not $project.id) { throw "project create missing id" }
  Write-Host ("project create: ok ({0})" -f $project.id)

  $file = Invoke-ApiJson -method GET -path ("/projects/{0}/files/main.tex" -f $project.id)
  if (-not ($file.content -match "\\documentclass")) { throw "expected main.tex content to be readable" }
  Write-Host "file read: ok"

  Write-Host "validation: ok"
} finally {
  if ($proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force | Out-Null
  }
}
