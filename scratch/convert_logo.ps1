Add-Type -AssemblyName System.Drawing

$src = "C:\Users\ADMIN\.gemini\antigravity-ide\brain\f06846e5-ad28-416c-a3e1-307e7e3ba6be\.user_uploaded\media_1789812916145.jpg"
$assetsDir = "c:\Users\ADMIN\OneDrive\Desktop\keith projects\Kalinga Portal\assets"
$rootDir = "c:\Users\ADMIN\OneDrive\Desktop\keith projects\Kalinga Portal"

$img = [System.Drawing.Image]::FromFile($src)

# Save high-res PNG and JPG in assets
$img.Save("$assetsDir\kalinga-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Save("$assetsDir\kalinga-logo.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

# 128x128 high-res favicon
$bmp128 = New-Object System.Drawing.Bitmap 128, 128
$g = [System.Drawing.Graphics]::FromImage($bmp128)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($img, 0, 0, 128, 128)
$g.Dispose()
$bmp128.Save("$assetsDir\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp128.Save("$rootDir\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 32x32 standard favicon for .ico
$bmp32 = New-Object System.Drawing.Bitmap 32, 32
$g32 = [System.Drawing.Graphics]::FromImage($bmp32)
$g32.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g32.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g32.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g32.DrawImage($img, 0, 0, 32, 32)
$g32.Dispose()

$hIcon = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream "$rootDir\favicon.ico", ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$fs.Dispose()

$fsAssets = New-Object System.IO.FileStream "$assetsDir\favicon.ico", ([System.IO.FileMode]::Create)
$icon.Save($fsAssets)
$fsAssets.Close()
$fsAssets.Dispose()

$bmp32.Dispose()
$bmp128.Dispose()
$img.Dispose()

Write-Output "Logo and favicon conversion complete!"
