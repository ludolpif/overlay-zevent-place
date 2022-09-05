// ==UserScript==
// @name         zevent-place-overlay
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      1.6.10
// @description  Please organize with other participants on Discord: https://discord.gg/sXe5aVW2jV ; Press H to hide/show again the overlay.
// @author       ludolpif, ventston
// @match        https://place.zevent.fr/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zevent.fr
// @grant        none
// @downloadURL  https://github.com/ludolpif/overlay-zevent-place/raw/main/browser-script/zevent-place-overlay.user.js
// @updateURL    https://github.com/ludolpif/overlay-zevent-place/raw/main/browser-script/zevent-place-overlay.user.js
// ==/UserScript==
/*
 * Script used as base, form MinusKube: https://greasyfork.org/fr/scripts/444833-z-place-overlay/code
 * Original and this code licence: MIT
 * Copyright 2021-2022 ludolpif, ventston
 * Thanks to : grewa for help on CSS
 */
(function() {
    'use strict';
    const version = "1.6.10";
    console.log("zevent-place-overlay: version " + version);
    // Global constants and variables for our script
    const overlayJSON = "https://timeforzevent.fr/overlay.json";
    let refreshOverlays = true;
    let safeModeDisableUI = false;
    let wantedOverlayURLs = []; // TODO should be id or URL for manual/custom or known overlay
    /*
     * FR: Utilisateurs du script: vous pouvez éditer les lignes loadOverlay() ci-après pour mémoriser dans votre navigateur
     *      vos choix d'overlay sans utiliser le menu "Overlays" proposé par ce script sur https://place.zevent.fr/
     * Pour ce faire :
     *  0) S'assurer que vous lisez ça depuis un onglet de l'extension TamperMonkey dans votre navigateur
     *    (sinon vous avez manqué des étapes de la documentation sous README.md: https://github.com/ludolpif/overlay-zevent-place )
     *  1) Utilisez une ligne //loadOveray(...); laissée en exemple
     *  2) SÉCURITÉ: ne tentez pas de charger autre chose qu'une image .png
     *  3) Remplacez l'URL d'exemple par l'URL de l'overlay de voter choix
     *  4) Enlevez le double-slash // avant loadOverlay(...); pour activer cette ligne de code
     *  5) Sauvez le script (Ctrl+S)
     *  6) Fermez cet onglet (editeur Tampermonkey)
     *  7) Allez sur l'onglet de https://place.zevent.fr et rafraichissez avec Ctrl+R
     * Remarques :
     * - Les calques (overlays) ne s'affichent qu'après l'authentification sur le site https://place.zevent.fr
     * - Ne touchez pas / préservez les point-virgules en fin de ligne de code, le script tombe en panne sinon.
     * Mode sans échec :
     * - Si vous avez un bug avec l'UI, mettez vos URL dans des lignes loadOverlay(...);
     *     et enlevez le // devant la ligne //safeModeDisableUI...
     */
    //safeModeDisableUI = true;
    loadOverlay("https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/examples/demo-overlay.png" );
    loadOverlay("https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/examples/demo-overlay2.png" );
    //loadOverlay("https://somewebsite.com/someoverlay.png" );
    /*
     * EN: Script users: you can edit loadOverlay(...) lines above to memorize in your browser
     *      your overlay choices without using the "Overlays" menu from this script on https://place.zevent.fr/
     * To do that:
     *  0) Make sure you read this from a web browser's tab, from the TamperMonkey extension
     *    (if not, you have missed steps in the documentation below README.md: https://github.com/ludolpif/overlay-zevent-place )
     *  1) Use an line of code left as example like //loadOveray(...);
     *  2) SECURITY: don't try to load anything but a .png file
     *  3) Replace the example URL by the URL the the overlay of your choice
     *  4) Remove the double-slash // before loadOverlay(...); to enable this line of code
     *  5) Save the script (Ctrl+S)
     *  6) Close this tab (Tampermonkey editor)
     *  7) Go on https://place.zevent.fr browser tab and refresh the page with Ctrl+R
     * Remarks :
     * - Overlays will display only after successful authentication on https://place.zevent.fr website
     * - Don't mess up any semi-colon (;) at end of code lines, it will break the script.
     * Safe mode :
     * - If you have a bug with the UI, put your URLs in some loadOverlay(...); lines
     *     and rmove the double-slash // before //safeModeDisableUI... line
     */
    function loadOverlay(url) {
        // TODO don't push multiple times the same URL
        wantedOverlayURLs.unshift(url); // <img> will be appended in wantedOverlayURLs order
        refreshOverlays = true;
    }
    function reloadOverlays(origCanvas, ourOverlays) {
        const parentDiv = origCanvas.parentElement;
        // CSS fix for firefox ESR 91 ('pixellated' needs >=93)
        if (navigator.userAgent.replace(/^Mozilla.* rv:(\d+).*$/, '$1') < 93) {
            parentDiv.style.setProperty('image-rendering', 'crisp-edges');
        }
        // Remove all our <img>
        // TODO remove all addEventListener before deleting <img> ?
        if ( !ourOverlays ) ourOverlays = [];
        if ( !Array.isArray(ourOverlays) ) ourOverlays = [ ourOverlays ];
        ourOverlays.forEach(function (e) { e.remove() });
        // Insert them again
        let left=0, top=0, width=500, height=500; //TODO detect size
        wantedOverlayURLs.forEach(function (url) { appendOverlayInDOM(origCanvas, parentDiv, left, top, width, height, url) });
        refreshOverlays = false;
    }
    function reloadUIWantedOverlays() {
        console.log("zevent-place-overlay: reloadUIWantedOverlays() for " + wantedOverlayURLs.length + " overlays");
        const ulWantedOverlays = document.querySelector('#zevent-place-overlay-ui-list-wanted-overlays');
        if (ulWantedOverlays) {
            ulWantedOverlays.innerHTML = "";
            let i=0;
            wantedOverlayURLs.forEach(function (id_or_url) {
                if ( typeof id_or_url === "string" ) {
                    let id, data;
                    if ( knownOverlays[id_or_url] ) {
                        data = knownOverlays[id_or_url];
                        id = data.id;
                    } else {
                        id = 'custom-' + i;
                        data = {
                            url: id_or_url,
                            community_name: id
                        }
                    }
                    appendUIWantedOverlays(ulWantedOverlays, id, data);
                }
                i = i+1;
            });
        }
    }
    function reloadUIKnownOverlays() {
        const knownOverlaysIds = Object.keys(knownOverlays);
        console.log("zevent-place-overlay: reloadUIKnownOverlays() for " + knownOverlaysIds.length + " overlays");
        const ulKnownOverlays = document.querySelector('#zevent-place-overlay-ui-list-known-overlays');
        if (ulKnownOverlays) {
            ulKnownOverlays.innerHTML = "";
            knownOverlaysIds.forEach(function (id) { appendUIKnownOverlays(ulKnownOverlays, id, knownOverlays[id]); });
        }
    }
    function appendOverlayInDOM(origCanvas, parentDiv, left, top, width, height, url) {
        const image = document.createElement("img");
        image.className = "zevent-place-overlay-img";
        image.width = width; image.height = height; image.src = url;
        image.style = "background: none; position: absolute; left: " + left + "px; top: " + top + "px;";
        console.log("zevent-place-overlay: loadOverlay(), inserting img: " + url + " at " + left + ", " + top + " size " + width + ", " + height);
        parentDiv.appendChild(image);
        document.addEventListener('keypress', function(event) {
            if (event.code == 'KeyH') {
                image.hidden = !image.hidden;
            }
        });
    }
    function appendOurUI(origUI) {
        //TODO construire les onClick des boutons avec les id venant des données
        const ourUI = document.createElement("div");
        ourUI.id = "zevent-place-overlay-ui";
        ourUI.style = `
            padding: 0 8px; border-radius: 20px; background: #1f1f1f;
            position: fixed; top: 16px; left: 16px; z-index: 999;`
        ourUI.innerHTML = `
            <div id="zevent-place-overlay-ui-head" style="display: flex; align-items: center; height: 40px;">
                <button
                    onClick="const n = document.querySelector('#zevent-place-overlay-ui-body'); if ( n.hidden ) { n.hidden=false; n.style.height='calc(100vh - 72px)'; } else { n.hidden=true; n.style.height='0'; }"
                    class="zevent-place-overlay-btn zevent-place-overlay-big-btn"
                    >
                    <svg height="24px" viewBox="0 0 32 32">
                        <path fill="white" d="M4,10h24c1.104,0,2-0.896,2-2s-0.896-2-2-2H4C2.896,6,2,6.896,2,8S2.896,10,4,10z M28,14H4c-1.104,0-2,0.896-2,2  s0.896,2,2,2h24c1.104,0,2-0.896,2-2S29.104,14,28,14z M28,22H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h24c1.104,0,2-0.896,2-2  S29.104,22,28,22z"/>
                    </svg>
                </button>
                Overlays
                <span id="zevent-place-overlay-ui-version" style="color:gray; font-size:70%; padding-left:1em;"></span>
            </div>
            <div id="zevent-place-overlay-ui-body" hidden style="display: flex; flex-flow: row wrap; flex-direction: column; height: 0vh; transition: all 0.2s ease 0s;">
                <div id="zevent-place-overlay-ui-overlaylist" style="flex: 1; overflow-x:hidden; overflow-y: auto;">
                    <label for="zevent-place-overlay-ui-input-url">Ajout via URL</label><br />
                    <input id="zevent-place-overlay-ui-input-url" name="zevent-place-overlay-ui-input-url" type="text" size="48" style="width: 270px" value="https://somesite.com/someoverlay.png"></input>
                    <button
                        onClick="const n = document.querySelector('#zevent-place-overlay-ui-input-url'); loadOverlay(n.value);"
                    >OK</button>
                    <br /><hr />
                    Overlay actifs&nbsp;
                    <div id="zevent-place-overlay-ui-list-wanted-overlays"></div>
                    <br /><hr />
                    Overlay disponibles&nbsp;
                    <div id="zevent-place-overlay-ui-list-known-overlays"></div>
                </div>
            </div>
        `;
        const versionSpan = ourUI.querySelector('#zevent-place-overlay-ui-version');
        if (versionSpan) { versionSpan.innerHTML = 'v' + version };
        origUI.appendChild(ourUI);
        // wantedOverlayURLs may have already values if set with loadOverlay() in script, so display them
        reloadUIWantedOverlays();
    }
    function appendUIWantedOverlays(ulWantedOverlays, id, data) {
        const btnRemoveOnClick = "eventAddKnownOverlay('" + id + "')";
        const btnPreviewOnClick = "";
        const tr = document.createElement("div");
        tr.className = "overlay-list-item";
        tr.id = 'wanted-node-'+id;
        tr.innerHTML= `
            <div class="action_del">
                <button onClick="` + btnRemoveOnClick + `"
                    class="zevent-place-overlay-btn"
                    >-</button>
            </div>
            <div class="community_name"></div>
            <div class="community_twitch"></div>
            <div class="community_discord"></div>
            <div class="thread_url"></div>
            <div class="preview_btn"></div>
        `;
        if ( typeof data.community_name === "string" ) {
            const nodeCommunityName = document.createTextNode(data.community_name);
            tr.querySelector('.community_name').appendChild(nodeCommunityName);
        }
        if ( typeof data.url === "string" ) {
            const aPreview = document.createElement("a");
            aPreview.href = data.url;
            aPreview.target="_blank";
            aPreview.alt = "Aperçu";
            aPreview.innerHTML = '<button class="zevent-place-overlay-btn">👁</button>';
            tr.querySelector('.preview_btn').appendChild(aPreview);
        }
        ulWantedOverlays.appendChild(tr);
    }
    function appendUIKnownOverlays(ulKnownOverlays, id, data) {
        //TODO get rid of table, use <ul> and if community_name to 160px wide, whatever the content (white-space: nowrap; overflow: hidden; text-overflow: ellipsis; don't work with <td>)
        // Don't concat json data directly in innerHTML (prevent some injection attacks)
        const btnAddOnClick = "eventAddKnownOverlay('" + id + "')";
        const btnDescriptionClick = "eventToggleKnownOverlayDescription('" + id + "')";
        const tr = document.createElement("div");
        tr.id = 'avail-node-'+id;
        tr.className = "overlay-list-item";
        tr.innerHTML= `
            <div class="action_add">
                <button onClick="` + btnAddOnClick + `"
                    class="zevent-place-overlay-btn"
                    >+</button>
            </div>
            <div class="community_name"></div>
            <div class="community_twitch"></div>
            <div class="community_discord"></div>
            <div class="thread_url"></div>
            <div class="description_btn">
                   <button class="zevent-place-overlay-btn" onClick="` + btnDescriptionClick + `">?</button>
            </div>`;
        if ( typeof data.community_name === "string" ) {
            const nodeCommunityName = document.createTextNode(data.community_name);
            tr.querySelector('.community_name').appendChild(nodeCommunityName);
        }
        if ( typeof data.community_twitch === "string" ) {
            const aTwitch = document.createElement("a");
            aTwitch.href = data.community_twitch;
            aTwitch.alt = "Twitch";
            aTwitch.innerHTML = twitchLogoSVG;
            tr.querySelector('.community_twitch').appendChild(aTwitch);
        }
        if ( typeof data.community_discord === "string" ) {
            const aDiscord= document.createElement("a");
            aDiscord.href = data.community_discord;
            aDiscord.alt = "Discord";
            aDiscord.innerHTML = discordLogoSVG;
            tr.querySelector('.community_discord').appendChild(aDiscord);
        }
        const aThread = document.createElement("a");
        aThread.href = data.thread_url;
        aThread.alt = "Fil";
        aThread.innerHTML = '<img height="24px" src="' + threadLogoB64 + '" alt="Fil Discord Commu ZEvent/Place"/></a></td>';
        tr.querySelector('.thread_url').appendChild(aThread);

        ulKnownOverlays.appendChild(tr);

        const tr2 = document.createElement("tr");
        tr2.id = 'desc-node-'+id;
        tr2.style = "padding: 5px; height: 0px";
        tr2.hidden = true;
        if ( typeof data.community_discord === "string" ) {
            const nodeDescription = document.createTextNode(data.description);
            tr2.appendChild(nodeDescription);
        }
        ulKnownOverlays.appendChild(tr2);
    }
    // TODO pb portée : onClick et fonction anonyme
    function eventAddKnownOverlay(id) {
        console.log("zevent-place-overlay: eventAddKnownOverlay(id)", id);
        const availNode = document.querySelector('#avail-node-'+id);
        console.log("DEBUG availNode", availNode);
        if (availNode) { availNode.style.height = "0px" };
        loadOverlay(knownOverlays[id]);
    }
    function eventToggleKnownOverlayDescription(id) {
        console.log("zevent-place-overlay: eventToggleKnownOverlayDescription(id)", id);
        const descriptionNode = document.querySelector('#desc-node-'+id);
        console.log("DEBUG descriptionNode", descriptionNode);
        if (descriptionNode) {
            if ( descriptionNode.hidden ) {
                descriptionNode.style.height = '';
            } else {
                descriptionNode.style.height = '0px';
            }
            descriptionNode.hidden = !descriptionNode.hidden;
        }
    }
    function appendOurCSS(origHead) {
        const style=document.createElement('style');
        style.type='text/css';

        const globalStyle=`
            .overlay-list-item{
                display: flex;
                padding: 5px;
            }
        
            .community_name{
               text-overflow: ellipsis;
               overflow: hidden;
               padding: 5px; 
               width: 160px;
               white-space: nowrap;
            }
            .community_twitch,
            .community_discord,
            .thread_url,
            .preview_btn,
            .description_btn {
                padding: 2px;
            }
            
            .zevent-place-overlay-btn,
            .zevent-place-overlay-big-btn{
                border-radius: 50%; 
                border:none; 
                color: #fff; 
                background-color:#050505; 
                cursor:pointer;
            }
            
            .zevent-place-overlay-btn{
                width:24px; 
                height:24px;
            }
            
            .zevent-place-overlay-big-btn{
                width:40px;
                height:40px;
            } 
        
        `;

        if(style.styleSheet){
            style.styleSheet.cssText=globalStyle;
        }else{
            style.appendChild(document.createTextNode(globalStyle));
        }
        origHead.appendChild(style);
    }
    function keepOurselfInDOM() {
        let origCanvas = document.querySelector('#place-canvas');
        if ( !origCanvas ) console.log("zevent-place-overlay: keepOurselfInDOM() origCanvas: " + origCanvas);

        let ourOverlays = document.querySelector('.zevent-place-overlay-img');
        if ( origCanvas && (!ourOverlays || refreshOverlays ) ) {
            console.log("zevent-place-overlay: keepOurselfInDOM() origCanvas: " + !!origCanvas + ", ourOverlays: " + !!ourOverlays + ", refreshOverlays:" + refreshOverlays );
            reloadOverlays(origCanvas, ourOverlays);
            reloadUIWantedOverlays();
        }
        if ( !safeModeDisableUI ) {
            /* Nothing for now
             let origHead = document.querySelector('head');
             if ( !origHead ) console.log("zevent-place-overlay: keepOurselfInDOM() origHead: " + !!origHead);
             let ourCSS = document.querySelector('#zevent-place-overlay-css');
             if ( origHead && !ourCSS ) {
             console.log("zevent-place-overlay: keepOurselfInDOM() origHead: " + !!origHead + ", ourCSS: " + !!ourCSS);
             appendOurCSS(origHead);
             }*/
            let origUI = document.querySelector('.place');
            if ( !origUI ) console.log("zevent-place-overlay: keepOurselfInDOM() origCanvas: " + origCanvas);
            let ourUI = document.querySelector('#zevent-place-overlay-ui');
            if ( origUI && !ourUI ) {
                console.log("zevent-place-overlay: keepOurselfInDOM() origUI: " + !!origUI + ", ourUI: " + !!ourUI);
                appendOurUI(origUI);
                fetchKnownOverlays(); //XXX alternative call to test with local knownOverlays : reloadUIKnownOverlays();
            }
        }
    }
    function fetchKnownOverlays() {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            console.log("zevent-place-overlay: fetchKnownOverlays() xmlhttp state: " + this.readyState + " status: " + this.status);
            if (this.readyState == 4 && this.status == 200) {
                var data = JSON.parse(this.responseText);
                knownOverlays = jsonSanityCheck(data);
                reloadUIKnownOverlays();
            }
        };
        xmlhttp.open("GET", overlayJSON, true);
        xmlhttp.send();
    }
    function jsonSanityCheck(data) {
        //TODO sanity checks
        return data;
    }
    // Following embed data to not depend or generate trafic to external webservers
    const threadLogoB64 = "data:image/png;base64, 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";
    const twitchLogoSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M21 3v11.74l-4.696 4.695h-3.913l-2.437 2.348H6.913v-2.348H3V6.13L4.227 3H21zm-1.565 1.565H6.13v11.74h3.13v2.347l2.349-2.348h4.695l3.13-3.13V4.565zm-3.13 3.13v4.696h-1.566V7.696h1.565zm-3.914 0v4.696h-1.565V7.696h1.565z"></path></svg>'
    const discordLogoSVG= '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 71 80"><path fill="#5865f2" d="M60.1045 13.8978C55.5792 11.8214 50.7265 10.2916 45.6527 9.41542C45.5603 9.39851 45.468 9.44077 45.4204 9.52529C44.7963 10.6353 44.105 12.0834 43.6209 13.2216C38.1637 12.4046 32.7345 12.4046 27.3892 13.2216C26.905 12.0581 26.1886 10.6353 25.5617 9.52529C25.5141 9.44359 25.4218 9.40133 25.3294 9.41542C20.2584 10.2888 15.4057 11.8186 10.8776 13.8978C10.8384 13.9147 10.8048 13.9429 10.7825 13.9795C1.57795 27.7309 -0.943561 41.1443 0.293408 54.3914C0.299005 54.4562 0.335386 54.5182 0.385761 54.5576C6.45866 59.0174 12.3413 61.7249 18.1147 63.5195C18.2071 63.5477 18.305 63.5139 18.3638 63.4378C19.7295 61.5728 20.9469 59.6063 21.9907 57.5383C22.0523 57.4172 21.9935 57.2735 21.8676 57.2256C19.9366 56.4931 18.0979 55.6 16.3292 54.5858C16.1893 54.5041 16.1781 54.304 16.3068 54.2082C16.679 53.9293 17.0513 53.6391 17.4067 53.3461C17.471 53.2926 17.5606 53.2813 17.6362 53.3151C29.2558 58.6202 41.8354 58.6202 53.3179 53.3151C53.3935 53.2785 53.4831 53.2898 53.5502 53.3433C53.9057 53.6363 54.2779 53.9293 54.6529 54.2082C54.7816 54.304 54.7732 54.5041 54.6333 54.5858C52.8646 55.6197 51.0259 56.4931 49.0921 57.2228C48.9662 57.2707 48.9102 57.4172 48.9718 57.5383C50.038 59.6034 51.2554 61.5699 52.5959 63.435C52.6519 63.5139 52.7526 63.5477 52.845 63.5195C58.6464 61.7249 64.529 59.0174 70.6019 54.5576C70.6551 54.5182 70.6887 54.459 70.6943 54.3942C72.1747 39.0791 68.2147 25.7757 60.1968 13.9823C60.1772 13.9429 60.1437 13.9147 60.1045 13.8978ZM23.7259 46.3253C20.2276 46.3253 17.3451 43.1136 17.3451 39.1693C17.3451 35.225 20.1717 32.0133 23.7259 32.0133C27.308 32.0133 30.1626 35.2532 30.1066 39.1693C30.1066 43.1136 27.28 46.3253 23.7259 46.3253ZM47.3178 46.3253C43.8196 46.3253 40.9371 43.1136 40.9371 39.1693C40.9371 35.225 43.7636 32.0133 47.3178 32.0133C50.9 32.0133 53.7545 35.2532 53.6986 39.1693C53.6986 43.1136 50.9 46.3253 47.3178 46.3253Z"/></svg>';
    /*
     * Following JSON is from URL you can found in global const overlayJSON
     * It is embed here in case of problems during getting it at runtime.
     * Use the bot commands on Discord mentionned in @description to publicly register an overlay in this json
     */
    let knownOverlays = {};

    // Run the script with delay, MutationObserver fail in some configs (race condition between this script and the original app)
    let intervalID = setInterval(keepOurselfInDOM, 1000);
    appendOurCSS(document.getElementsByTagName('head')[0])
})();
