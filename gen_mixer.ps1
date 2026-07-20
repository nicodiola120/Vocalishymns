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

# ===== PHONE: MIXER VIEW =====
$w=1080; $h=1920
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "HighQuality"

# App background
FillRect $g 255 20 21 38 0 0 $w $h
FillRect $g 25 255 255 255 0 0 90 $w
DrawTxtW $g "CHORALIS" 24 Bold 50 28

# Mixer overlay (covers below header)
FillRect $g 242 5 7 10 0 90 $w ($h-90)

# Mixer header bar
FillRect $g 255 20 21 38 0 90 $w 55
$p = New-Object System.Drawing.Pen($C::FromArgb(12,255,255,255))
$g.DrawLine($p, 0, 145, $w, 145)
$p.Dispose()

# MIXER label
DrawTxtW $g "MIXER" 12 Bold 50 106
DrawTxt $g "4CH" 10 Bold 100 100 115 130 90 108
DrawTxt $g "Amazing Grace" 10 Bold 140 148 163 180 150 108

# Transport buttons
$tx=$w-220
FillRect $g 255 37 99 235 $tx 98 36 36
DrawTxtW $g ">" 14 Bold ($tx+12) 104
FillRect $g 12 255 255 255 ($tx+44) 98 36 36
DrawTxt $g "||" 10 Bold 140 148 163 180 ($tx+56) 108
FillRect $g 12 255 255 255 ($tx+88) 98 36 36
DrawTxt $g "R" 11 Bold 140 148 163 180 ($tx+101) 107
FillRect $g 12 255 255 255 ($tx+132) 98 36 36
DrawTxt $g "RST" 8 Bold 140 148 163 180 ($tx+135) 110
FillRect $g 12 255 255 255 ($w-55) 98 36 36
DrawTxt $g "X" 10 Bold 140 148 163 180 ($w-44) 107

# Portrait scrub bar
FillRect $g 12 255 255 255 0 145 $w 60
$p = New-Object System.Drawing.Pen($C::FromArgb(15,255,255,255))
$g.DrawLine($p, 0, 205, $w, 205)
$p.Dispose()
FillRect $g 25 255 255 255 20 162 1040 6
FillRect $g 255 255 255 255 320 158 8 14
DrawTxt $g "1:24" 9 Bold 80 100 115 130 20 176
DrawTxt $g "3:45" 9 Bold 80 100 115 130 1010 176
DrawTxt $g "V" 11 Bold 100 100 115 130 20 192
FillRect $g 20 255 255 255 38 196 120 4

# Channel strips (4 stacked)
$channels = @(
    ,@("SOPRANO", 129,140,248, "#818cf8", 0.75, 14, "#3b82f6")
    ,@("ALTO", 244,114,182, "#f472b6", 0.55, 11, "#ec4899")
    ,@("TENOR", 56,189,248, "#38bdf8", 0.60, 12, "#0ea5e9")
    ,@("BASS", 52,211,153, "#34d399", 0.40, 8, "#10b981")
)

$cy = 215
foreach ($ch in $channels) {
    $name = $ch[0]; $cr=$ch[1]; $cg=$ch[2]; $cb=$ch[3]; $vol=$ch[5]; $led=$ch[6]; $kr=$ch[7]
    $csH = 400
    
    # Panel
    $gp = New-Object System.Drawing.SolidBrush($C::FromArgb(8,255,255,255))
    $pr = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pr.AddArc(10, $cy, 16, 16, 180, 90)
    $pr.AddArc(($w-26), $cy, 16, 16, 270, 90)
    $pr.AddArc(($w-26), ($cy+$csH-16), 16, 16, 0, 90)
    $pr.AddArc(10, ($cy+$csH-16), 16, 16, 90, 90)
    $pr.CloseFigure()
    $g.FillPath($gp, $pr)
    $gp.Dispose()
    $pr.Dispose()
    
    # Divider line
    $p = New-Object System.Drawing.Pen($C::FromArgb(12,255,255,255))
    $g.DrawLine($p, 10, ($cy+35), ($w-10), ($cy+35))
    $p.Dispose()
    
    # Mic icon
    $micP = New-Object System.Drawing.Pen($C::FromArgb($cr,$cg,$cb), 2.5)
    $micP.StartCap = "Round"; $micP.EndCap = "Round"
    $g.DrawEllipse($micP, 28, ($cy+10), 10, 10)
    $g.DrawLine($micP, 38, ($cy+10), 38, ($cy+24))
    $micP.Dispose()
    
    # Voice name
    DrawTxtW $g $name 11 Bold 48 ($cy+12)
    
    # Fader area
    $csy = $cy + 40
    $csh = $csH - 45
    $ftx = 50; $fty = $csy + 15; $ftw = 32; $fth = $csh - 50
    
    DrawTxt $g "0" 10 Bold 100 100 115 130 ($ftx+10) ($fty-6)
    
    # Track background
    $trk = New-Object System.Drawing.SolidBrush($C::FromArgb(12,255,255,255))
    $tr = New-Object System.Drawing.Drawing2D.GraphicsPath
    $tr.AddArc($ftx, $fty, 16, 16, 180, 90)
    $tr.AddArc(($ftx+$ftw-16), $fty, 16, 16, 270, 90)
    $tr.AddArc(($ftx+$ftw-16), ($fty+$fth-16), 16, 16, 0, 90)
    $tr.AddArc($ftx, ($fty+$fth-16), 16, 16, 90, 90)
    $tr.CloseFigure()
    $g.FillPath($trk, $tr)
    $trk.Dispose()
    $tr.Dispose()
    
    # LED segments
    $segH = [math]::Max(2, [int](($fth-8)/32))
    $ledStart = $fty + $fth - 4 - $segH
    for ($si = 0; $si -lt 32; $si++) {
        $lY = $ledStart - ($si * $segH)
        if ($si -lt $led) {
            if ($si -lt 16) {
                FillRect $g 255 16 185 129 ($ftx+4) $lY ($ftw-8) $segH
            } elseif ($si -lt 24) {
                FillRect $g 255 251 191 36 ($ftx+4) $lY ($ftw-8) $segH
            } else {
                FillRect $g 255 244 63 94 ($ftx+4) $lY ($ftw-8) $segH
            }
        } else {
            FillRect $g 25 16 185 129 ($ftx+4) $lY ($ftw-8) $segH
        }
    }
    
    # Knob
    $knobY = $fty + ($fth-24) * (1 - $vol)
    $wh = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillEllipse($wh, ($ftx+4), $knobY, 24, 24)
    $wh.Dispose()
    # Knob border
    $kc = [System.Drawing.ColorTranslator]::FromHtml($kr)
    $kp = New-Object System.Drawing.Pen($kc, 4)
    $g.DrawEllipse($kp, ($ftx+4), $knobY, 24, 24)
    $kp.Dispose()
    # Center dot
    FillRect $g 255 15 23 42 ($ftx+14) ($knobY+10) 4 4
    
    DrawTxt $g "-60" 8 Bold 80 100 115 130 ($ftx+5) ($fty+$fth+4)
    
    # Solo / Mute
    $sbx = 120
    FillRect $g 12 255 255 255 $sbx ($csy+30) 70 34
    DrawTxt $g "S" 12 Bold 140 148 163 180 ($sbx+30) ($csy+37)
    FillRect $g 12 255 255 255 $sbx ($csy+80) 70 34
    DrawTxt $g "M" 12 Bold 140 148 163 180 ($sbx+30) ($csy+87)
    
    $cy += $csH + 6
}

$g.Dispose()
$bmp.Save("C:\Users\Domz\Downloads\New folder (13) - Copy\screenshot2_mixer.png")
$bmp.Dispose()
Write-Output "Mixer screenshot done"
