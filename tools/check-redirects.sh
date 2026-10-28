#!/bin/bash
# Проверка карты 301/410 со старых адресов WordPress — прогнать в день переезда.
#   bash tools/check-redirects.sh https://sinderela.md
# Список старых адресов взят из wp-sitemap.xml старого сайта (28.10.2026, 36 адресов).
B="${1:-https://sinderela.md}"; B="${B%/}"; bad=0
t(){ r=$(curl -s -o /dev/null -m 20 -w "%{http_code} %{redirect_url}" "$B$1"); r="${r% }"; r="${r//$B/}"
  if [ "$r" = "$2" ]; then echo "ok   $1 → $r"; else echo "FAIL $1 → $r (ждали: $2)"; bad=$((bad+1)); fi; }
S="301 /#services"; RS="301 /ro/#services"
t / "200"; t /ro/ "200"; t /en/ "200"
t /uslugi/ "$S"; t /uslugi-i-czeny/ "301 /#calc"; t /o-nas/ "301 /#footer"; t /first-line/ "301 /#trust"
for u in remont-obuvi chistka-tekstilya chistka-odezhdy-iz-kozhi chistka-meha-i-dubleonok chistka-platev chistka-shtor-chehlov \
  chistka-podushek-s-zamenoi-napernika chistka-pledov chistka-detskih-igrushek upakovka-veshei sniker-himchistka crasenie-izdelii; do t "/uslugi/$u/" "$S"; done
t /ro/acasa/ "301 /ro/"; t /ro/servicii/ "$RS"; t /ro/preturi-si-servicii/ "301 /ro/#calc"; t /ro/despre-noi/ "301 /ro/#footer"; t /ro/first-line-servicii/ "301 /ro/#trust"
for u in reparatie-incaltaminte ambalarea-hainelor curatarea-jucariilor-pentru-copii curatarea-blanurilor-si-palton-din-piele-argasita \
  curatarea-articolelor-din-piele curatarea-rochiilor curatarea-paturilor curatarea-pernelor-cu-inlocuirea-unei-perne \
  curatarea-articolelor-textilate curatarea-draperiilor-huselor curatarea-uscata-a-adidasilor vopsirea-articolelor; do t "/ro/servicii/$u/" "$RS"; done
t /blocks/footer-about-us/ "410"; t /ro/blocks/footer-about-us-2/ "410"
t /sitemap_index.xml "301 /sitemap.xml"; t /wp-sitemap.xml "301 /sitemap.xml"
t "/?p=1" "410"; t /wp-admin/ "410"; t /wp-login.php "410"; t /xmlrpc.php "410"; t /feed/ "410"
t /sitemap.xml "200"; t /robots.txt "200"; t "/?utm_source=test" "200"; t /takoi-stranicy-net "404"
echo; [ $bad -eq 0 ] && echo "Всё верно." || { echo "Провалов: $bad"; exit 1; }
