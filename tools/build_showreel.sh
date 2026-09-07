# ⚠ Пути внутри — абсолютные к build-сессии. Замени под свой репозиторий. См. tools/README.md
#!/bin/bash
set -e
D=/sessions/awesome-ecstatic-tesla/mnt/SinderelaMD/_showcase
OUT="$D/Sinderela_showreel.mp4"
# порядок: платье, кожа, кроссовки, мех, текстиль, пальто
G="$D/gown.mp4"; L="$D/c2_leather.mp4"; S="$D/c4_sneakers.mp4"; F="$D/c6_fur.mp4"; T="$D/c5_textile.mp4"; C="$D/c1_coat.mp4"
DUR=4.5; TD=0.7
pp="trim=0:$DUR,setpts=PTS-STARTPTS,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24,format=yuv420p"
ffmpeg -y \
 -i "$G" -i "$L" -i "$S" -i "$F" -i "$T" -i "$C" \
 -filter_complex "\
[0:v]$pp[v0];[1:v]$pp[v1];[2:v]$pp[v2];[3:v]$pp[v3];[4:v]$pp[v4];[5:v]$pp[v5];\
[v0][v1]xfade=transition=fade:duration=$TD:offset=3.8[x1];\
[x1][v2]xfade=transition=fade:duration=$TD:offset=7.6[x2];\
[x2][v3]xfade=transition=fade:duration=$TD:offset=11.4[x3];\
[x3][v4]xfade=transition=fade:duration=$TD:offset=15.2[x4];\
[x4][v5]xfade=transition=fade:duration=$TD:offset=19.0[x5];\
[x5]vignette=PI/5[vout]" \
 -map "[vout]" -an -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -movflags +faststart "$OUT" 2>&1 | tail -3
echo "----"
ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 "$OUT"
ls -la "$OUT"
