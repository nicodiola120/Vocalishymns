Add-Type -AssemblyName System.Drawing

$C = [System.Drawing.Color]

function FillRect {
    param($g, $a, $r, $g2, $b, $x, $y, $w, $h)
    $br = New-Object System.Drawing.SolidBrush($C::FromArgb($a, $r, $g2, $b))
    $g.FillRectangle($br, $x, $y, $w, $h)
    $br.Dispose()
}

function DrawTxt {
    param($g, $s, $sz, $st, $a, $r, $g2, $b, $x, $y)
    $f = New-Object System.Drawing.Font("Segoe UI", $sz, [System.Drawing.FontStyle]::$st)
    $br = New-Object System.Drawing.SolidBrush($C::FromArgb($a, $r, $g2, $b))
    $g.DrawString($s, $f, $br, $x, $y)
    $f.Dispose()
    $br.Dispose()
}

function DrawTxtW {
    param($g, $s, $sz, $st, $x, $y)
    $f = New-Object System.Drawing.Font("Segoe UI", $sz, [System.Drawing.FontStyle]::$st)
    $g.DrawString($s, $f, [System.Drawing.Brushes]::White, $x, $y)
    $f.Dispose()
}

# ===== 10-inch tablet (2560x1600 landscape) =====
$w=2560; $h=1600
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "HighQuality"

FillRect $g 255 20 21 38 0 0 $w $h
FillRect $g 25 255 255 255 0 0 $w 90
DrawTxtW $g "CHORALIS" 28 Bold 60 28
FillRect $g 20 255 255 255 ($w-80) 25 40 40

# Mixer header
DrawTxtW $g "MIXER" 22 Bold 60 120
DrawTxtW $g "How Great Thou Art" 16 Bold 60 160
DrawTxt $g "4-part harmony - 3:45" 14 Regular 140 148 163 180 60 190

# Transport
FillRect $g 30 59 130 246 60 230 120 45
DrawTxtW $g "<< >>" 14 Bold 75 238
FillRect $g 255 59 130 246 200 220 140 55
DrawTxtW $g "PLAY" 18 Bold 245 230
FillRect $g 30 59 130 246 360 230 120 45
DrawTxtW $g "STOP" 14 Bold 380 238

# 4 channel strips
$clrs = @((59,130,246),(236,72,153),(14,165,233),(16,185,129))
$names = @("SOPRANO","ALTO","TENOR","BASS")
$hys = @(550,750,480,820)
$cx = 200

foreach ($i in 0..3) {
    $c2 = $clrs[$i]
    FillRect $g 10 255 255 255 $cx 310 500 900
    
    # Track line
    $tp = New-Object System.Drawing.Pen($C::FromArgb(30,255,255,255), 10)
    $tp.StartCap = "Round"; $tp.EndCap = "Round"
    $g.DrawLine($tp, ($cx+250), 370, ($cx+250), 1120)
    $tp.Dispose()
    
    $hy = $hys[$i]
    $wh = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillEllipse($wh, ($cx+236), ($hy-18), 28, 28)
    $wh.Dispose()
    
    DrawTxtW $g $names[$i] 18 Bold ($cx+180) 1160
    FillRect $g 15 255 255 255 ($cx+180) 1200 60 32
    DrawTxt $g "S" 13 Bold 140 148 163 180 ($cx+205) 1206
    FillRect $g 15 255 255 255 ($cx+260) 1200 60 32
    DrawTxt $g "M" 13 Bold 140 148 163 180 ($cx+285) 1206
    
    $cx += 550
}

# Master
FillRect $g 15 255 255 255 60 1320 2440 70
DrawTxt $g "Master Volume" 15 Bold 140 148 163 180 60 1350
FillRect $g 20 255 255 255 300 1345 2000 8

$bmp.Save("C:\Users\Domz\Downloads\New folder (13) - Copy\screenshot_tablet_10in.png")
$g.Dispose()
$bmp.Dispose()
Write-Output "10-inch tablet done"
