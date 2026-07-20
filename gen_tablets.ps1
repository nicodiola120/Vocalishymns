Add-Type -AssemblyName System.Drawing
$C = [System.Drawing.Color]

function FillRect { param($g,$a,$r,$g2,$b,$x,$y,$w,$h) $br=New-Object System.Drawing.SolidBrush($C::FromArgb($a,$r,$g2,$b)); $g.FillRectangle($br,$x,$y,$w,$h); $br.Dispose() }
function DrawTxt { param($g,$s,$sz,$st,$a,$r,$g2,$b,$x,$y) $f=New-Object System.Drawing.Font("Segoe UI",$sz,[System.Drawing.FontStyle]::$st); $br=New-Object System.Drawing.SolidBrush($C::FromArgb($a,$r,$g2,$b)); $g.DrawString($s,$f,$br,$x,$y); $f.Dispose(); $br.Dispose() }
function DrawTxtW { param($g,$s,$sz,$st,$x,$y) $f=New-Object System.Drawing.Font("Segoe UI",$sz,[System.Drawing.FontStyle]::$st); $g.DrawString($s,$f,[System.Drawing.Brushes]::White,$x,$y); $f.Dispose() }

$channels = @(
    ,@("SOPRANO", 129,140,248, 0.75, 14, "#3b82f6")
    ,@("ALTO", 244,114,182, 0.55, 11, "#ec4899")
    ,@("TENOR", 56,189,248, 0.60, 12, "#0ea5e9")
    ,@("BASS", 52,211,153, 0.40, 8, "#10b981")
)

# ===== 7-INCH TABLET (1920x1200) =====
$w=1920; $h=1200
$bmp=New-Object System.Drawing.Bitmap($w,$h)
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode="HighQuality"

FillRect $g 255 20 21 38 0 0 $w $h
FillRect $g 25 255 255 255 0 0 70 $w
DrawTxtW $g "CHORALIS" 22 Bold 50 22

# Mixer overlay
FillRect $g 242 5 7 10 0 70 $w ($h-70)

# Mixer header
FillRect $g 255 20 21 38 0 70 $w 45
DrawTxtW $g "MIXER" 11 Bold 40 82
DrawTxt $g "4CH" 9 Bold 100 100 115 130 75 83
DrawTxt $g "Amazing Grace" 10 Bold 140 148 163 180 120 83

# Transport buttons in header
$tx=$w-250
FillRect $g 255 37 99 235 $tx 76 32 32
DrawTxtW $g ">" 13 Bold ($tx+10) 81
FillRect $g 12 255 255 255 ($tx+38) 76 32 32
DrawTxt $g "||" 9 Bold 140 148 163 180 ($tx+49) 84
FillRect $g 12 255 255 255 ($tx+76) 76 32 32
DrawTxt $g "R" 10 Bold 140 148 163 180 ($tx+87) 83
FillRect $g 12 255 255 255 ($tx+114) 76 32 32
DrawTxt $g "RST" 7 Bold 140 148 163 180 ($tx+118) 85
FillRect $g 12 255 255 255 ($w-50) 76 32 32
DrawTxt $g "X" 9 Bold 140 148 163 180 ($w-40) 83

# Scrub bar below header
FillRect $g 20 255 255 255 200 96 1520 6
DrawTxt $g "1:24" 8 Bold 80 100 115 130 200 108
DrawTxt $g "3:45" 8 Bold 80 100 115 130 1700 108

$cx=200
foreach ($ch in $channels) {
    $name=$ch[0]; $cr=$ch[1]; $cg=$ch[2]; $cb=$ch[3]; $vol=$ch[4]; $led=$ch[5]; $kr=$ch[6]
    
    # Panel
    FillRect $g 8 255 255 255 ($cx-10) 130 340 900
    $p = New-Object System.Drawing.Pen($C::FromArgb(10,255,255,255))
    $g.DrawLine($p, ($cx-10), 165, ($cx+329), 165)
    $p.Dispose()
    
    # Mic + name
    $mp=New-Object System.Drawing.Pen($C::FromArgb($cr,$cg,$cb),2.5)
    $mp.StartCap="Round"; $mp.EndCap="Round"
    $g.DrawEllipse($mp, ($cx+10), 138, 9, 9)
    $g.DrawLine($mp, ($cx+19), 138, ($cx+19), 150)
    $mp.Dispose()
    DrawTxtW $g $name 10 Bold ($cx+35) 138
    
    # Fader track
    $ftx=$cx+120; $fty=190; $ftw=28; $fth=700
    DrawTxt $g "0" 9 Bold 100 100 115 130 ($ftx+8) ($fty-8)
    
    # Rounded rect for track
    $trk = New-Object System.Drawing.SolidBrush($C::FromArgb(12,255,255,255))
    $tr = New-Object System.Drawing.Drawing2D.GraphicsPath
    $tr.AddArc($ftx, $fty, 14, 14, 180, 90)
    $tr.AddArc(($ftx+$ftw-14), $fty, 14, 14, 270, 90)
    $tr.AddArc(($ftx+$ftw-14), ($fty+$fth-14), 14, 14, 0, 90)
    $tr.AddArc($ftx, ($fty+$fth-14), 14, 14, 90, 90)
    $tr.CloseFigure()
    $g.FillPath($trk, $tr)
    $trk.Dispose()
    $tr.Dispose()
    
    # LEDs
    $segH=[math]::Max(2,[int](($fth-8)/32))
    $ledStart=$fty+$fth-4-$segH
    for ($si=0;$si -lt 32;$si++) {
        $lY=$ledStart-($si*$segH)
        if ($si -lt $led) {
            if ($si -lt 16) { FillRect $g 255 16 185 129 ($ftx+4) $lY ($ftw-8) $segH }
            elseif ($si -lt 24) { FillRect $g 255 251 191 36 ($ftx+4) $lY ($ftw-8) $segH }
            else { FillRect $g 255 244 63 94 ($ftx+4) $lY ($ftw-8) $segH }
        } else { FillRect $g 25 16 185 129 ($ftx+4) $lY ($ftw-8) $segH }
    }
    
    # Knob
    $knobY=$fty+($fth-24)*(1-$vol)
    $wh=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillEllipse($wh, ($ftx+2), $knobY, 24, 24); $wh.Dispose()
    $kc=[System.Drawing.ColorTranslator]::FromHtml($kr)
    $kp=New-Object System.Drawing.Pen($kc,4); $g.DrawEllipse($kp, ($ftx+2), $knobY, 24, 24); $kp.Dispose()
    FillRect $g 255 15 23 42 ($ftx+12) ($knobY+10) 4 4
    
    DrawTxt $g "-60" 7 Bold 80 100 115 130 ($ftx+5) ($fty+$fth+2)
    
    # Solo / Mute (side by side in landscape)
    $sbx=$cx+170
    FillRect $g 12 255 255 255 $sbx ($fty+100) 50 30
    DrawTxt $g "S" 10 Bold 140 148 163 180 ($sbx+20) ($fty+107)
    FillRect $g 12 255 255 255 ($sbx+60) ($fty+100) 50 30
    DrawTxt $g "M" 10 Bold 140 148 163 180 ($sbx+80) ($fty+107)
    
    $cx+=360
}

$g.Dispose()
$bmp.Save("C:\Users\Domz\Downloads\New folder (13) - Copy\screenshot_tablet_7in.png")
$bmp.Dispose()
Write-Output "7in done"

# ===== 10-INCH TABLET (2560x1600) =====
$w=2560; $h=1600
$bmp=New-Object System.Drawing.Bitmap($w,$h)
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode="HighQuality"

FillRect $g 255 20 21 38 0 0 $w $h
FillRect $g 25 255 255 255 0 0 85 $w
DrawTxtW $g "CHORALIS" 26 Bold 60 28

FillRect $g 242 5 7 10 0 85 $w ($h-85)

# Mixer header
FillRect $g 255 20 21 38 0 85 $w 55
DrawTxtW $g "MIXER" 13 Bold 50 100
DrawTxt $g "4CH" 10 Bold 100 100 115 130 90 102
DrawTxt $g "Amazing Grace" 12 Bold 140 148 163 180 150 102

# Transport
$tx=$w-300
FillRect $g 255 37 99 235 $tx 92 40 40
DrawTxtW $g ">" 15 Bold ($tx+13) 100
FillRect $g 12 255 255 255 ($tx+48) 92 40 40
DrawTxt $g "||" 11 Bold 140 148 163 180 ($tx+62) 103
FillRect $g 12 255 255 255 ($tx+96) 92 40 40
DrawTxt $g "R" 12 Bold 140 148 163 180 ($tx+110) 102
FillRect $g 12 255 255 255 ($tx+144) 92 40 40
DrawTxt $g "RST" 8 Bold 140 148 163 180 ($tx+149) 105
FillRect $g 12 255 255 255 ($w-60) 92 40 40
DrawTxt $g "X" 11 Bold 140 148 163 180 ($w-45) 102

FillRect $g 20 255 255 255 250 120 2000 8
DrawTxt $g "1:24" 9 Bold 80 100 115 130 250 135
DrawTxt $g "3:45" 9 Bold 80 100 115 130 2200 135

$cx=250
foreach ($ch in $channels) {
    $name=$ch[0]; $cr=$ch[1]; $cg=$ch[2]; $cb=$ch[3]; $vol=$ch[4]; $led=$ch[5]; $kr=$ch[6]
    
    FillRect $g 8 255 255 255 ($cx-10) 160 480 1150
    $p = New-Object System.Drawing.Pen($C::FromArgb(10,255,255,255))
    $g.DrawLine($p, ($cx-10), 200, ($cx+469), 200)
    $p.Dispose()
    
    $mp=New-Object System.Drawing.Pen($C::FromArgb($cr,$cg,$cb),3)
    $mp.StartCap="Round"; $mp.EndCap="Round"
    $g.DrawEllipse($mp, ($cx+15), 170, 12, 12)
    $g.DrawLine($mp, ($cx+27), 170, ($cx+27), 185)
    $mp.Dispose()
    DrawTxtW $g $name 12 Bold ($cx+40) 170
    
    $ftx=$cx+180; $fty=230; $ftw=32; $fth=850
    DrawTxt $g "0" 10 Bold 100 100 115 130 ($ftx+10) ($fty-10)
    
    $trk = New-Object System.Drawing.SolidBrush($C::FromArgb(12,255,255,255))
    $tr = New-Object System.Drawing.Drawing2D.GraphicsPath
    $tr.AddArc($ftx, $fty, 16, 16, 180, 90)
    $tr.AddArc(($ftx+$ftw-16), $fty, 16, 16, 270, 90)
    $tr.AddArc(($ftx+$ftw-16), ($fty+$fth-16), 16, 16, 0, 90)
    $tr.AddArc($ftx, ($fty+$fth-16), 16, 16, 90, 90)
    $tr.CloseFigure()
    $g.FillPath($trk, $tr); $trk.Dispose(); $tr.Dispose()
    
    $segH=[math]::Max(2,[int](($fth-8)/32))
    $ledStart=$fty+$fth-4-$segH
    for ($si=0;$si -lt 32;$si++) {
        $lY=$ledStart-($si*$segH)
        if ($si -lt $led) {
            if ($si -lt 16) { FillRect $g 255 16 185 129 ($ftx+4) $lY ($ftw-8) $segH }
            elseif ($si -lt 24) { FillRect $g 255 251 191 36 ($ftx+4) $lY ($ftw-8) $segH }
            else { FillRect $g 255 244 63 94 ($ftx+4) $lY ($ftw-8) $segH }
        } else { FillRect $g 25 16 185 129 ($ftx+4) $lY ($ftw-8) $segH }
    }
    
    $knobY=$fty+($fth-24)*(1-$vol)
    $wh=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillEllipse($wh, ($ftx+4), $knobY, 24, 24); $wh.Dispose()
    $kc=[System.Drawing.ColorTranslator]::FromHtml($kr)
    $kp=New-Object System.Drawing.Pen($kc,4); $g.DrawEllipse($kp, ($ftx+4), $knobY, 24, 24); $kp.Dispose()
    FillRect $g 255 15 23 42 ($ftx+14) ($knobY+10) 4 4
    
    DrawTxt $g "-60" 8 Bold 80 100 115 130 ($ftx+8) ($fty+$fth+2)
    
    $sbx=$cx+235
    FillRect $g 12 255 255 255 $sbx ($fty+150) 60 36
    DrawTxt $g "S" 11 Bold 140 148 163 180 ($sbx+25) ($fty+157)
    FillRect $g 12 255 255 255 ($sbx+70) ($fty+150) 60 36
    DrawTxt $g "M" 11 Bold 140 148 163 180 ($sbx+95) ($fty+157)
    
    $cx+=510
}

$g.Dispose()
$bmp.Save("C:\Users\Domz\Downloads\New folder (13) - Copy\screenshot_tablet_10in.png")
$bmp.Dispose()
Write-Output "10in done"
Write-Output "All tablet screenshots done"
