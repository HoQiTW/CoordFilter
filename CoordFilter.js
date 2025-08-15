// License: MIT
// Copyright (c) HoQi
// Disclaimer: By uploading a user-generated mod (script) for use with Tribal Wars, the creator grants InnoGames a perpetual, irrevocable, worldwide, royalty-free, non-exclusive license to use, reproduce, distribute, publicly display, modify, and create derivative works of the mod. This license permits InnoGames to incorporate the mod into any aspect of the game and its related services, including promotional and commercial endeavors, without any requirement for compensation or attribution to the uploader. The uploader represents and warrants that they have the legal right to grant this license and that the mod does not infringe upon any third-party rights.

(async function () {
    'use strict';

    // Check whether we are on the map screen
    if (!/screen=map/.test(location.href)) {
        const world = window.location.href.match(/https:\/\/(.*?\.tribalwars\.[^/]+)/);
        if (world) {
            window.location.href = `https://${world[1]}/game.php?screen=map`;
        } else {
            UI.ErrorMessage(badScreen);
        }
        return;
    }

    // Script config
    window.scriptConfig = {
        scriptData: {
            prefix: 'Coordinates filter',
            name: 'Coordinates filter',
            version: '2.0',
            author: 'HoQi',
            authorUrl: 'https://twscripts.dev/',
            helpLink: 'https://forum.klanhaboru.hu/index.php?threads/intervallumos-koordináta-szűrő.6184',
        },
        allowedScreens: ['map'],
        isDebug: false,
        enableCountApi: true,
    };

    // Localization
    const hu = {
        coordinatesFilter: 'Koordinátaszűrő',
        clansLabel: 'Klánok (pontosvesszővel):',
        playersLabel: 'Játékosok (pontosvesszővel):',
        xMinLabel: 'X min:', xMaxLabel: 'X max:',
        yMinLabel: 'Y min:', yMaxLabel: 'Y max:',
        runButton: 'Szűrés indítása',
        separatorLabel: 'Formátum:',
        playersNotFound: 'Játékosok nem találhatók:',
        tribesNotFound: 'Klánok nem találhatók:',
        clansPlaceholder: 'Klán1;Klán2',
        playersPlaceholder: 'Játékos1;Játékos2',
        badScreen: 'Ez a szkript csak a térkép képernyőn használható!'
    };
    const en = {
        coordinatesFilter: 'Coordinates filter',
        clansLabel: 'Tribes (use semicolon):',
        playersLabel: 'Players (use semicolon):',
        xMinLabel: 'X min:', xMaxLabel: 'X max:',
        yMinLabel: 'Y min:', yMaxLabel: 'Y max:',
        runButton: 'Start processing',
        separatorLabel: 'Format:',
        playersNotFound: 'Players not found:',
        tribesNotFound: 'Tribes not found:',
        clansPlaceholder: 'Tribe1;Tribe2',
        playersPlaceholder: 'Player1;Player2',
        badScreen: 'This script can only be used on the map screen!'
    };

    const L = location.hostname.endsWith('.hu') ? hu : en;

    // Loading TWSDK
    const loadTwSDK = () => new Promise((resolve, reject) => {
        if (window.twSDK) return resolve();
        const script = document.createElement('script');
        script.src = 'https://twscripts.dev/scripts/twSDK.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    const parseList = input => input.split(/[;\n]/).map(s => s.trim()).filter(Boolean);

    // Filtering coordinates
    const filterCoords = (villages, xmin, xmax, ymin, ymax, sep) =>
        villages.map(v => `${v[2]}${sep}${v[3]}`)
                .filter(c => {
                    const [x, y] = c.split(sep).map(Number);
                    return x >= xmin && x <= xmax && y >= ymin && y <= ymax;
                });

    // Creating UI
    const createUI = () => {
        const container = document.querySelector('#map_config') || document.body;

        const tbl = document.createElement('table');
        tbl.className = 'vis';
        tbl.style.width = '100%';
        tbl.innerHTML = `
<tr><th colspan="4">${L.coordinatesFilter}</th></tr>
<tr><td colspan="4"><label>${L.clansLabel}</label><br><input id="coordFilterTribes" type="text" style="width: 98%;" placeholder="${L.clansPlaceholder}"></td></tr>
<tr><td colspan="4"><label>${L.playersLabel}</label><br><input id="coordFilterPlayers" type="text" style="width: 98%;" placeholder="${L.playersPlaceholder}"></td></tr>
<tr>
  <td><label>${L.xMinLabel}</label><br><input id="coordFilterXmin" type="number" style="width: 95%;"></td>
  <td><label>${L.xMaxLabel}</label><br><input id="coordFilterXmax" type="number" style="width: 95%;"></td>
  <td><label>${L.yMinLabel}</label><br><input id="coordFilterYmin" type="number" style="width: 93%;"></td>
  <td><label>${L.yMaxLabel}</label><br><input id="coordFilterYmax" type="number" style="width: 93%;"></td>
</tr>
<tr>
  <td colspan="2"><label>${L.separatorLabel}</label><br>
    <select id="coordFilterSeparator" style="width: 100%;">
      <option value="|">xxx|yyy</option>
      <option value="," >xxx,yyy</option>
    </select>
  </td>
  <td colspan="2">
    <button id="coordFilterRun" class="btn float_right" style="margin-top: 5px; width: 100%;">${L.runButton}</button>
  </td>
</tr>
<tr>
  <td colspan="4">
    <textarea id="coordFilterResult" rows="6" style="width:98%; margin-top: 5px; margin-bottom: 2px;" readonly placeholder="xxx|yyy xxx|yyy..."></textarea>
    <p style="text-align:right; margin: 2px 0 0;"><small>by <span style="color: purple;"><b>HoQi</b></span></small></p>
  </td>
</tr>`;

        container.appendChild(tbl);
        document.getElementById('coordFilterRun').addEventListener('click', runFilter);
    };

    // Filtering the actual coordinates
    const runFilter = async () => {
        const tribesInput = parseList(document.getElementById('coordFilterTribes').value);
        const playersInput = parseList(document.getElementById('coordFilterPlayers').value);
        const separator = document.getElementById('coordFilterSeparator').value;

        const getVal = (id, def) => {
            const v = document.getElementById(id).value.trim();
            return v === '' ? def : parseInt(v, 10);
        };

        const xmin = getVal('coordFilterXmin', -Infinity);
        const xmax = getVal('coordFilterXmax', Infinity);
        const ymin = getVal('coordFilterYmin', -Infinity);
        const ymax = getVal('coordFilterYmax', Infinity);

        // loading TWSDK data
        const [villages, players, tribes] = await Promise.all([
            twSDK.worldDataAPI('village'),
            twSDK.worldDataAPI('player'),
            twSDK.worldDataAPI('ally')
        ]);

        // Tribe or player not found
        const missingTribes = tribesInput.filter(name => !tribes.some(t => t[2]?.toLowerCase() === name.toLowerCase()));
        const missingPlayers = playersInput.filter(name => !players.some(p => p[1]?.toLowerCase() === name.toLowerCase()));

        // Throw error banner when not found
        if (missingTribes.length > 0 || missingPlayers.length > 0) {
            document.getElementById('coordFilterResult').value = '';
            let msgParts = [];
            if (missingTribes.length > 0) msgParts.push(`${L.tribesNotFound} ${missingTribes.join(', ')}`);
            if (missingPlayers.length > 0) msgParts.push(`${L.playersNotFound} ${missingPlayers.join(', ')}`);
            UI.ErrorMessage(msgParts.join(' | '));
            return;
        }

        // Collection of IDs
        const playerIds = twSDK.getEntityIdsByArrayIndex(playersInput, players, 1);
        const tribeIds = twSDK.getEntityIdsByArrayIndex(tribesInput, tribes, 2);
        const tribePlayerIds = twSDK.getTribeMembersById(tribeIds, players);
        const allPlayerIds = [...new Set([...playerIds, ...tribePlayerIds])];

        // Filter coordinates matching the filter
        const matchingVillages = villages.filter(v => allPlayerIds.includes(parseInt(v[4])));
        const filteredCoords = filterCoords(matchingVillages, xmin, xmax, ymin, ymax, separator);
        document.getElementById('coordFilterResult').value = filteredCoords.length > 0 ? filteredCoords.join(' ') : '';
    };
    await loadTwSDK();
    await window.twSDK.init(window.scriptConfig);
    createUI();
})();
