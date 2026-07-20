Add-Type -AssemblyName System.Drawing

$c = [System.Drawing.Color]
$w = 1080
$h = 1920

function Rect($g, $a, $r, $g2, $b, $x, $y, $w2, $h2) {
    $br = New-Object System.Drawing.SolidBrush($c::FromArgb($a, $r, $g2, $b))
    $g.FillRectangle($br, $x, $y, $w2, $h2)
    $br.Dispose()
}

function Text($g, $s, $sz, $bold, $a, $r, $g2, $b, $x, $y) {
    $f = New-Object System.Drawing.Font("Segoe UI", $sz, [System.Drawing.FontStyle]::$bold)
    $br = New-Object System.Drawing.SolidBrush($c::FromArgb($a, $r, $g2, $b))
    $g.DrawString($s, $f, $br, $x, $y)
    $f.Dispose()
    $br.Dispose()
}

function TextW($g, $s, $sz, $bold, $x, $y) {
    $f = New-Object System.Drawing.Font("Segoe UI", $sz, [System.Drawing.FontStyle]::$bold)
    $g.DrawString($s, $f, [System.Drawing.Brushes]::White, $x, $y)
    $f.Dispose()
}

# ========== SCREENSHOT 1: Hymn Library ==========
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "HighQuality"

# Background
Rect $g 255 20 21 38 0 0 $w $h

# Header
Rect $g 25 255 255 255 0 0 $w 90
TextW $g "CHORALIS" 24 Bold 50 28
Rect $g 20 255 255 255 ($w-70) 28 36 36

# Sidebar background
Rect $g 10 255 255 255 0 90 320 ($h-90)
$p = New-Object System.Drawing.Pen($c::FromArgb(15,255,255,255))
$g.DrawLine($p, 320, 90, 320, $h)
$p.Dispose()

# Sidebar header
TextW $g "HYMNS" 16 Bold 20 110
Rect $g 20 59 130 246 220 108 80 30
TextW $g "IMPORT" 11 Bold 235 114

# Tabs
Rect $g 30 59 130 246 15 155 135 32
TextW $g "Library" 12 Bold 55 160
Rect $g 10 255 255 255 165 155 135 32
Text $g "Download" 12 Bold 140 148 163 180 188 160

# Search
Rect $g 10 255 255 255 15 200 290 36
Text $g "Search hymns..." 12 Regular 80 148 163 180 25 210

# Song list
$songs = @("Amazing Grace", "How Great Thou Art", "It Is Well With My Soul", "Great Is Thy Faithfulness", "Blessed Assurance")
$y = 255
for ($i = 0; $i -lt 5; $i++) {
    if ($i -eq 1) {
        Rect $g 20 59 130 246 10 $y 300 55
        Rect $g 255 59 130 246 10 $y 5 55
        TextW $g $songs[$i] 13 Bold 40 ($y+10)
        Rect $g 30 59 130 246 40 ($y+33) 45 16
        Text $g "4-part" 8 Regular 200 220 230 250 48 ($y+33)
    } else {
        Text $g $songs[$i] 13 Bold 200 203 213 220 40 ($y+10)
        Rect $g 8 255 255 255 40 ($y+33) 45 16
        Text $g "4-part" 8 Regular 100 148 163 180 45 ($y+33)
    }
    Text $g "3:45" 9 Regular 80 100 115 130 265 ($y+10)
    $y += 60
}

# Sidebar footer
Rect $g 5 255 255 255 0 ($h-50) 320 50
$p = New-Object System.Drawing.Pen($c::FromArgb(15,255,255,255))
$g.DrawLine($p, 0, ($h-50), 320, ($h-50))
$p.Dispose()
Text $g "5 hymns loaded" 10 Regular 80 148 163 180 100 ($h-32)

# Empty state (main area)
$np = New-Object System.Drawing.Pen($c::FromArgb(35,100,116,139), 5)
$np.StartCap = "Round"; $np.EndCap = "Round"
$g.DrawEllipse($np, 480, 500, 35, 35)
$g.DrawLine($np, 515, 500, 515, 570)
$g.DrawLine($np, 515, 555, 550, 545)
$g.DrawLine($np, 550, 510, 550, 575)
$g.DrawEllipse($np, 540, 570, 28, 28)
$np.Dispose()

Text $g "No Track Selected" 28 Bold 120 148 163 180 340 640
Text $g "Choose a hymn from the library to begin" 16 Regular 80 100 116 139 310 700
Rect $g 255 37 99 235 380 780 320 55
TextW $g "Open Library" 15 Bold 470 796

$bmp.Save("C:\Users\Domz\Downloads\New folder (13) - Copy\screenshot1_hymns.png")
$g.Dispose()
$bmp.Dispose()
Write-Output "Screenshot 1 saved"

# ========== SCREENSHOT 2: Mixer View ==========
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "HighQuality"

Rect $g 255 5 7 10 0 0 $w $h

# Mixer header
Rect $g 200 15 20 30 0 0 $w 90
TextW $g "MIXER" 20 Bold 50 28
Text $g "How Great Thou Art" 13 Bold 180 148 163 180 200 80

# Transport buttons in header
# Play button (active, blue)
Rect $g 255 59 130 246 ($w/2-80) 18 100 40
TextW $g "►" 16 Bold ($w/2-72) 24
# Stop button
Rect $g 15 255 255 255 ($w/2+30) 18 100 40
Text $g "■" 16 Bold 140 148 163 180 ($w/2+40) 24
# Loop button
Rect $g 15 255 255 255 ($w/2+140) 18 100 40
Text $g "↻" 16 Bold 140 148 163 180 ($w/2+150) 24

# 4 channel strips
$voices = @(
    @{name="SOPRANO"; color=@(59,130,246); vol=0.7; y=120},
    @{name="ALTO"; color=@(236,72,153); vol=0.5; y=200},
    @{name="TENOR"; color=@(14,165,233); vol=0.8; y=100},
    @{name="BASS"; color=@(16,185,129); vol=0.3; y=280}
)

foreach ($v in $voices) {
    $cy = $v.y + 160
    
    # Track line (vertical)
    $tp = New-Object System.Drawing.Pen($c::FromArgb(25,255,255,255), 6)
    $tp.StartCap = "Round"; $tp.EndCap = "Round"
    $g.DrawLine($tp, 150, 220, 150, 700)
    $tp.Dispose()
    
    # Handle
    $hz = $cy
    $whBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillEllipse($whBrush, 136, $hz-14, 28, 28)
    $whBrush.Dispose()
    
    # Volume level (LED meter style - right side)
    $ledX = 200
    $ledCnt = 20
    $activeLeds = [math]::Round($v.vol * $ledCnt)
    for ($li = 0; $li -lt $ledCnt; $li++) {
        $lx = $ledX
        $ly = 700 - ($li * 12)
        if ($li -lt $activeLeds) {
            if ($li -lt 10) {
                Rect $g 255 16 185 129 $lx ($ly-10) 8 10
            } elseif ($li -lt 15) {
                Rect $g 255 251 191 36 $lx ($ly-10) 8 10
            } else {
                Rect $g 255 244 63 94 $lx ($ly-10) 8 10
            }
        } else {
            Rect $g 20 255 255 255 $lx ($ly-10) 8 10
        }
    }
}

# Voice labels
$labels = @("SOPRANO", "ALTO", "TENOR", "BASS")
$labelColors = @((60,130,246), (236,72,153), (14,165,233), (16,185,129))
for ($i = 0; $i -lt 4; $i++) {
    $lx = 100 + ($i * 200)
    $lc = $labelColors[$i]
    TextW $g $labels[$i] 14 Bold $lx 780
    # Solo button
    Rect $g 12 255 255 255 $lx 810 50 28
    Text $g "S" 11 Bold 160 148 163 180 ($lx+20) 815
    # Mute button
    Rect $g 12 255 255 255 ($lx+60) 810 50 28
    Text $g "M" 11 Bold 160 148 163 180 ($lx+80) 815
}

$g.Dispose()
$bmp.Save("C:\Users\Domz\Downloads\New folder (13) - Copy\screenshot2_mixer.png")
$bmp.Dispose()
Write-Output "Screenshot 2 saved"

# ========== SCREENSHOT 3: Playback with controls ==========
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "HighQuality"

Rect $g 255 20 21 38 0 0 $w $h

# Header
Rect $g 25 255 255 255 0 0 $w 90
TextW $g "CHORALIS" 24 Bold 50 28
Rect $g 20 255 255 255 ($w-70) 28 36 36

# Now playing card
Rect $g 30 255 255 255 60 130 300 380

# Album art placeholder (rounded rect)
Rect $g 255 59 130 246 120 160 180 180

# Song info
TextW $g "How Great Thou Art" 22 Bold 140 370
Text $g "Hymn • 4-part harmony" 14 Regular 140 148 163 180 160 410

# Scrub bar
Rect $g 15 255 255 255 100 480 880 6

# Time labels
Text $g "1:24" 12 Regular 100 148 163 180 100 496
Text $g "3:45" 12 Regular 120 148 163 180 880 496

# Transport controls
$cx = $w / 2
Rect $g 20 255 255 255 ($cx-170) 560 60 60
Text $g "⏮" 22 Bold 140 148 163 180 ($cx-155) 572

Rect $g 255 59 130 246 ($cx-50) 550 100 80
TextW $g "►" 28 Bold ($cx-17) 567

Rect $g 20 255 255 255 ($cx+110) 560 60 60
Text $g "⏭" 22 Bold 140 148 163 180 ($cx+125) 572

# Volume section
Rect $g 10 255 255 255 100 700 880 80
Text $g "Volume" 14 Bold 140 148 163 180 100 720

# Volume slider
Rect $g 20 255 255 255 200 725 600 6

# Sound wave decoration at bottom
$swPen = New-Object System.Drawing.Pen($c::FromArgb(12,100,116,139), 3)
$swPen.StartCap = "Round"; $swPen.EndCap = "Round"
for ($sw = 0; $sw -lt 20; $sw++) {
    $swx = 100 + ($sw * 45)
    $swh = 20 + ($sw % 5) * 15
    $g.DrawLine($swPen, $swx, (900-$swh), $swx, 900)
}
$swPen.Dispose()

Text $g "Choir Voice Mixer" 16 Bold 80 148 163 180 120 ($h-120)
Text $g "Now Playing" 12 Regular 80 100 116 139 120 ($h-85)

$g.Dispose()
$bmp.Save("C:\Users\Domz\Downloads\New folder (13) - Copy\screenshot3_playback.png")
$g.Dispose()
$bmp.Dispose()
Write-Output "Screenshot 3 saved"

# ========== SCREENSHOT 4: Settings Modal ==========
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "HighQuality"

Rect $g 255 20 21 38 0 0 $w $h

# Dim overlay
Rect $g 180 0 0 0 0 0 $w $h

# Settings modal
Rect $g 255 11 12 21 150 300 780 500

# Modal header
Rect $g 255 20 21 38 150 300 780 60
TextW $g "Settings" 20 Bold 400 315
$p = New-Object System.Drawing.Pen($c::FromArgb(15,255,255,255))
$g.DrawLine($p, 150, 360, 930, 360)
$p.Dispose()

# Toggle row: Light Mode
Rect $g 255 11 12 21 180 390 350 50
Text $g "Light Mode" 16 Regular 200 203 213 220 200 405

# Toggle switch (off - blue left, gray right)
Rect $g 255 100 116 139 720 395 56 28
Rect $g 255 255 255 255 727 398 22 22

# Toggle row: Remove Ads
Text $g "Remove Ads" 16 Regular 200 203 213 220 200 470
Rect $g 255 59 130 246 720 460 170 40
TextW $g "PURCHASE" 12 Bold 745 470

# Toggle row: Mixer
Text $g "Auto-open Mixer" 16 Regular 200 203 213 220 200 540
Rect $g 255 50 50 50 720 535 56 28
Rect $g 255 100 116 139 727 538 22 22

# Version info
Text $g "Choralis v1.0.0" 12 Regular 80 148 163 180 400 750

$g.Dispose()
$bmp.Save("C:\Users\Domz\Downloads\New folder (13) - Copy\screenshot4_settings.png")
$g.Dispose()
$bmp.Dispose()
Write-Output "Screenshot 4 saved"

Write-Output "All screenshots generated!"
