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
  return Invoke-RestMethod -Method $method -Uri $uri -ContentType "application/json" -Body ($body | ConvertTo-Json -Depth 20)
}

function Convert-AssistantText($message, $choice = $null) {
  $content = $message.content
  if ($content -is [string]) {
    $line = [regex]::Replace([string]$content, "\s+", " ").Trim()
    if ($line.Length -gt 0) { return $line }
  }
  if ($content -is [System.Array]) {
    $parts = @()
    foreach ($item in $content) {
      if ($item -is [string]) {
        if ($item.Length -gt 0) { $parts += [string]$item }
      } elseif ($item.text) {
        $parts += [string]$item.text
      } elseif ($item.content) {
        $parts += [string]$item.content
      }
    }
    $joined = [regex]::Replace(($parts -join " "), "\s+", " ").Trim()
    if ($joined.Length -gt 0) { return $joined }
  }

  $reason = $message.reasoning
  if (-not $reason -and $choice) { $reason = $choice.reasoning }
  if ($reason -is [string]) {
    $line = [regex]::Replace([string]$reason, "\s+", " ").Trim()
    if ($line.Length -gt 0) { return $line }
  }

  return ""
}

Write-Host "starting backend on $base"

$existing = $null
try { $existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue } catch { $existing = $null }
if ($existing) {
  $pids = $existing | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $pids) { try { Stop-Process -Id $procId -Force | Out-Null } catch {} }
  Start-Sleep -Milliseconds 200
}

$proc = Start-Process -FilePath $node -ArgumentList @($backend) -WorkingDirectory $repo -PassThru -WindowStyle Hidden
try {
  $deadline = (Get-Date).AddSeconds(10)
  while ((Get-Date) -lt $deadline) {
    try {
      $health = Invoke-ApiJson -method GET -path "/health"
      if ($health.status -eq "ok") { break }
    } catch { Start-Sleep -Milliseconds 200 }
  }

  $settingsOn = Invoke-ApiJson -method PUT -path "/settings/ai-toggle" -body @{ enabled = $true }
  if ($settingsOn.aiEnabled -ne $true) { throw "expected aiEnabled=true after toggle" }
  Write-Host ("ai on: ok (provider={0} model={1})" -f $settingsOn.aiProvider, $settingsOn.aiModel)

  # Ensure a known-good Kimi chat model id for NVIDIA.
  try {
    Invoke-ApiJson -method PUT -path "/settings" -body @{ aiModel = "moonshotai/kimi-k2.5" } | Out-Null
  } catch { }

  Write-Host "preflight models..."
  $models = Invoke-ApiJson -method GET -path "/ai/models"
  $modelCount = @($models.response.data).Count
  Write-Host ("models: ok ({0} entries)" -f $modelCount)

  Write-Host "text chat..."
  $textResp = Invoke-ApiJson -method POST -path "/ai/chat" -body @{
    messages = @(
      @{ role = "system"; content = "You are a concise assistant." },
      @{ role = "user"; content = "Reply with: ok + 1 short sentence proving you can reason." }
    )
    maxTokens = 120
  }
  $textChoice = $textResp.response.choices[0]
  $textOneLine = Convert-AssistantText -message $textChoice.message -choice $textChoice
  $textPreview = if ($textOneLine.Length -gt 160) { $textOneLine.Substring(0, 160) } else { $textOneLine }
  Write-Host ("text response: {0}" -f $textPreview)

  $imgPath = Join-Path $repo "prism_inspo_ui\16.png"
  if (Test-Path $imgPath) {
    Write-Host "image chat (16.png)..."
    $bytes = [System.IO.File]::ReadAllBytes($imgPath)
    $b64 = [Convert]::ToBase64String($bytes)
    $dataUrl = "data:image/png;base64,$b64"
    $imgResp = Invoke-ApiJson -method POST -path "/ai/chat" -body @{
      messages = @(
        @{
          role = "user"
          content = @(
            @{ type = "text"; text = "Describe this image. List the main UI regions and 3 design traits." }
            @{ type = "image_url"; image_url = @{ url = $dataUrl } }
          )
        }
      )
      maxTokens = 220
    }
    $imgChoice = $imgResp.response.choices[0]
    $imgOneLine = Convert-AssistantText -message $imgChoice.message -choice $imgChoice
    $imgPreview = if ($imgOneLine.Length -gt 220) { $imgOneLine.Substring(0, 220) } else { $imgOneLine }
    Write-Host ("image response: {0}" -f $imgPreview)
  } else {
    Write-Host "image chat skipped (missing prism_inspo_ui\\16.png)"
  }

  Write-Host "edits call..."
  $editsResp = Invoke-ApiJson -method POST -path "/ai/edits" -body @{
    prompt = "Rewrite the introduction to be shorter."
    content = "\\section*{Intro}`nThis is a very long introduction."
    selection = @{ startLine = 1; endLine = 2 }
  }
  $summary = [string]$editsResp.suggestions[0].summary
  $summaryOneLine = [regex]::Replace($summary, "\s+", " ").Trim()
  $summaryPreview = if ($summaryOneLine.Length -gt 220) { $summaryOneLine.Substring(0, 220) } else { $summaryOneLine }
  Write-Host ("edits summary: {0}" -f $summaryPreview)

  Write-Host "kimi test: ok"
} finally {
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force | Out-Null }
}
