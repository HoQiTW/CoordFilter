# CoordFilter
Sziasztok!

Készítettem egy scriptet, amivel remélhetőleg ritkábban kell felmennem majd twstatsra. Az igény alapvetően onnan indult még korábban, hogy jó lenne a területalapú fakescriptek gyártását kicsit megkönnyíteni. A térkép képernyőn futtatható, máshol próbálkozva hibaüzenetet kapunk. Klánokat és játékosokat pontosvesszővel tagolva tudjuk felsorolni. Az elfogadásig még nem legális.

javascript:$.get("https://raw.githubusercontent.com/HoQiTW/CoordFilter/main/CoordFilter.js", r => { Function(r)(); }); void(0);

Szűrő nélkül:

![Szűrő nélkül](Screenshots/no-filter.png?raw=true "Szűrő nélkül")

Szűrővel:

![Szűrővel](Screenshots/filter.png?raw=true "Szűrővel")

A script használható bármelyik piacon és szerveren, jelenleg alapértelmezetten angol lokalizációt használ, ha nem .hu-n futtatjuk.

![lokalizáció](Screenshots/en.png?raw=true "Lokalizáció")

Képesek vagyunk klánokra és játékosokra is szűrni. Amennyiben egy játékos valamelyik listázandó klán tagja, akkor nem szerepeltetjük a koordinátáit kétszer.
Az eredményeket |-vel és vesszővel tagolva is megkaphatjuk, így támogatva a különböző fakescripteket.

![Vesszős tagolás](Screenshots/comma.png?raw=true "Vesszős tagolás")

Ha az egyik mezőben érvénytelen nevet adunk meg, akkor a szűrés sikertelen lesz és hibaüzenetben tájékoztat az elírásokról.

![Hibás keresés](Screenshots/not-found.png?raw=true "Hibás keresés")
