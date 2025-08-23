@echo off
echo Building FLASH DASH Frontend for Production...
echo.

echo Installing dependencies...
npm install

echo.
echo Building production version...
npm run build:prod

echo.
echo Build complete! 
echo The production files are in the 'dist' folder.
echo Upload the contents of the 'dist' folder to your web server at flashdash.vip
echo.
pause
