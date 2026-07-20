Add-Type -AssemblyName System.Drawing; $w=1080; $h=1920; function FilledRect($g,$b,$x,$y,$w,$h){$g.FillRectangle($b,$x,$y,$w,$h)}; function Txt($g,$s,$f,$b,$x,$y){$g.DrawString($s,$f,$b,$x,$y)}; $bmp=New-Object System.Drawing.Bitmap($w,$h); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.SmoothingMode="HighQuality"; $g.TextRenderingHint="AntiAliasGridFit"; $c=[System.Drawing.Color]
# bg
FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(20,21,38))) 0 0 $w $h
# header
FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(25,255,255,255))) 0 0 $w 90
Txt $g "CHORALIS" (New-Object System.Drawing.Font("Segoe UI",24,[System.Drawing.FontStyle]::Bold)) [System.Drawing.Brushes]::White 50 28
FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(20,255,255,255))) ($w-70) 28 36 36
# empty state
$np=New-Object System.Drawing.Pen($c::FromArgb(35,100,116,139),5); $np.StartCap="Round"; $np.EndCap="Round"; $g.DrawEllipse($np,480,500,35,35); $g.DrawLine($np,515,500,515,570); $g.DrawLine($np,515,555,550,545); $g.DrawLine($np,550,510,550,575); $g.DrawEllipse($np,540,570,28,28); $np.Dispose()
Txt $g "No Track Selected" (New-Object System.Drawing.Font("Segoe UI",28,[System.Drawing.FontStyle]::Bold)) (New-Object System.Drawing.SolidBrush($c::FromArgb(120,148,163,180))) 340 640
Txt $g "Choose a hymn from the library to begin" (New-Object System.Drawing.Font("Segoe UI",16)) (New-Object System.Drawing.SolidBrush($c::FromArgb(80,100,116,139))) 310 700
FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(37,99,235))) 380 780 320 55
Txt $g "Open Library" (New-Object System.Drawing.Font("Segoe UI",15,[System.Drawing.FontStyle]::Bold)) [System.Drawing.Brushes]::White 470 796
# sidebar
FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(10,255,255,255))) 0 90 320 ($h-90)
$g.DrawLine((New-Object System.Drawing.Pen($c::FromArgb(15,255,255,255))),320,90,320,$h)
Txt $g "HYMNS" (New-Object System.Drawing.Font("Segoe UI",16,[System.Drawing.FontStyle]::Bold)) [System.Drawing.Brushes]::White 20 110
FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(20,59,130,246))) 220 108 80 30
Txt $g "IMPORT" (New-Object System.Drawing.Font("Segoe UI",11,[System.Drawing.FontStyle]::Bold)) [System.Drawing.Brushes]::White 235 114
FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(30,59,130,246))) 15 155 135 32
FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(10,255,255,255))) 165 155 135 32
Txt $g "Library" (New-Object System.Drawing.Font("Segoe UI",12,[System.Drawing.FontStyle]::Bold)) [System.Drawing.Brushes]::White 55 160
Txt $g "Download" (New-Object System.Drawing.Font("Segoe UI",12,[System.Drawing.FontStyle]::Bold)) (New-Object System.Drawing.SolidBrush($c::FromArgb(140,148,163,180))) 188 160
FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(10,255,255,255))) 15 200 290 36
Txt $g "Search hymns..." (New-Object System.Drawing.Font("Segoe UI",12)) (New-Object System.Drawing.SolidBrush($c::FromArgb(80,148,163,180))) 25 210
# song list
$sn=@("Amazing Grace","How Great Thou Art","It Is Well With My Soul","Great Is Thy Faithfulness","Blessed Assurance"); $y=255; for($i=0;$i -lt 5;$i++){if($i -eq 1){FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(20,59,130,246))) 10 $y 300 55;FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(59,130,246))) 10 $y 5 55;Txt $g ($sn[$i]) (New-Object System.Drawing.Font("Segoe UI",13,[System.Drawing.FontStyle]::Bold)) [System.Drawing.Brushes]::White 40 ($y+10);FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(30,59,130,246))) 40 ($y+33) 45 16;Txt $g "4-part" (New-Object System.Drawing.Font("Segoe UI",8)) (New-Object System.Drawing.SolidBrush($c::FromArgb(200,220,230,250))) 48 ($y+33)}else{Txt $g ($sn[$i]) (New-Object System.Drawing.Font("Segoe UI",13,[System.Drawing.FontStyle]::Bold)) (New-Object System.Drawing.SolidBrush($c::FromArgb(200,203,213,220))) 40 ($y+10);FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(8,255,255,255))) 40 ($y+33) 45 16;Txt $g "4-part" (New-Object System.Drawing.Font("Segoe UI",8)) (New-Object System.Drawing.SolidBrush($c::FromArgb(100,148,163,180))) 45 ($y+33)};Txt $g "3:45" (New-Object System.Drawing.Font("Segoe UI",9)) (New-Object System.Drawing.SolidBrush($c::FromArgb(80,100,115,130))) 265 ($y+10);$y+=60}
FilledRect $g (New-Object System.Drawing.SolidBrush($c::FromArgb(5,255,255,255))) 0 ($h-50) 320 50;$g.DrawLine((New-Object System.Drawing.Pen($c::FromArgb(15,255,255,255))),0,($h-50),320,($h-50))
Txt $g "5 hymns loaded" (New-Object System.Drawing.Font("Segoe UI",10)) (New-Object System.Drawing.SolidBrush($c::FromArgb(80,148,163,180))) 100 ($h-32)
$g.Dispose(); $bmp.Save("C:\Users\Domz\Downloads\New folder (13) - Copy\screenshot1_hymns.png",[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose(); "1 done"
