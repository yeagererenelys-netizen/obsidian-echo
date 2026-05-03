$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")


# Compress Hero videos
Get-ChildItem -Path "public\videos\hero\*_anim.mp4" -Exclude "*_web*" | ForEach-Object {
    $outName = $_.FullName.Replace("_anim.mp4", "_anim_web.mp4")
    if (-not (Test-Path $outName)) {
        Write-Host "Compressing Hero: $($_.Name)"
        ffmpeg -y -i $_.FullName -vcodec libx264 -crf 23 -preset slow -an $outName
    }
}

# Compress Feature videos
Get-ChildItem -Path "public\videos\features\*_anim.mp4" -Exclude "*_web*" | ForEach-Object {
    $outName = $_.FullName.Replace("_anim.mp4", "_anim_web.mp4")
    if (-not (Test-Path $outName)) {
        Write-Host "Compressing Feature: $($_.Name)"
        ffmpeg -y -i $_.FullName -vcodec libx264 -crf 26 -preset slow -an $outName
    }
}

# Compress Background videos
Get-ChildItem -Path "public\videos\backgrounds\*_anim.mp4" -Exclude "*_web*" | ForEach-Object {
    $outName = $_.FullName.Replace("_anim.mp4", "_anim_web.mp4")
    if (-not (Test-Path $outName)) {
        Write-Host "Compressing BG: $($_.Name)"
        ffmpeg -y -i $_.FullName -vf scale=1280:720 -vcodec libx264 -crf 28 -preset slow -an $outName
    }
}

# Compress Brand videos
Get-ChildItem -Path "public\videos\brand\*_anim.mp4" -Exclude "*_web*" | ForEach-Object {
    $outName = $_.FullName.Replace("_anim.mp4", "_anim_web.mp4")
    if (-not (Test-Path $outName)) {
        Write-Host "Compressing Brand: $($_.Name)"
        ffmpeg -y -i $_.FullName -vf scale=1280:720 -vcodec libx264 -crf 28 -preset slow -an $outName
    }
}

Write-Host "All compressions finished."
