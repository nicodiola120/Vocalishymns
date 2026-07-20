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

# ===== 7-inch tablet (1920x1200 landscape) =====
$w=1920; $h=1200
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "HighQuality"

FillRect $g 255 20 21 38 0 0 $w $h
FillRect $g 25 255 255 255 0 0 $w 70
DrawTxtW $g "CHORALIS" 22 Bold 50 22
FillRect $g 20 255 255 255 ($w-60) 20 30 30

# Sidebar
FillRect $g 10 255 255 255 0 70 320 ($h-70)
DrawTxtW $g "HYMNS" 15 Bold 20 85
FillRect $g 20 59 130 246 220 83 80 25
DrawTxtW $g "IMPORT" 10 Bold 235 87

FillRect $g 30 59 130 246 15 120 135 28
DrawTxtW $g "Library" 11 Bold 55 124
FillRect $g 10 255 255 255 165 120 135 28
DrawTxt $g "Download" 11 Bold 140 148 163 180 188 124

FillRect $g 10 255 255 255 15 160 290 30
DrawTxt $g "Search hymns..." 11 Regular 80 148 163 180 25 168

$songs = @("Amazing Grace","How Great Thou Art","It Is Well With My Soul","Great Is Thy Faithfulness","Blessed Assurance")
$yy = 205
for ($i = 0; $i -lt 5; $i++) {
    if ($i -eq 1) {
        FillRect $g 20 59 130 246 10 $yy 300 50
        FillRect $g 255 59 130 246 10 $yy 5 50
        DrawTxtW $g $songs[$i] 12 Bold 40 ($yy+8)
        FillRect $g 30 59 130 246 40 ($yy+28) 45 14
        DrawTxt $g "4-part" 7 Regular 200 220 230 250 45 ($yy+28)
    } else {
        DrawTxt $g $songs[$i] 12 Bold 200 203 213 220 40 ($yy+8)
        FillRect $g 8 255 255 255 40 ($yy+28) 45 14
        DrawTxt $g "4-part" 7 Regular 100 148 163 180 45 ($yy+28)
    }
    $yy += 55
}

# Main content
$mx = 350
DrawTxtW $g "Recently Played" 20 Bold $mx 100
FillRect $g 15 255 255 255 $mx 140 1500 200
DrawTxtW $g "How Great Thou Art" 16 Bold ($mx+20) 160
DrawTxt $g "4-part hymn - 3:45" 12 Regular 140 148 163 180 ($mx+20) 190
FillRect $g 30 59 130 246 ($mx+20) 220 120 36
DrawTxtW $g "PLAY NOW" 11 Bold ($mx+36) 227

# Player bar
FillRect $g 200 15 20 30 0 ($h-80) $w 80
FillRect $g 255 255 255 255 200 ($h-45) 1520 6
DrawTxtW $g "How Great Thou Art" 14 Bold 0 ($h-55)
DrawTxt $g "1:24 / 3:45" 11 Regular 120 148 163 180 0 ($h-30)

$bmp.Save("C:\Users\Domz\Downloads\New folder (13) - Copy\screenshot_tablet_7in.png")
$g.Dispose()
$bmp.Dispose()
Write-Output "7-inch tablet done"
