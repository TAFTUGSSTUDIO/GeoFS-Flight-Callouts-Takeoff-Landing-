// ==UserScript==

// @name         GeoFS AI (GPT) ATC with Direct Gamepad Sync

// @namespace    https://avramovic.info/

// @version      2.0.1

// @description  AI ATC for GeoFS with synchronized joystick button push-to-talk

// @author       Nemanja Avramovic (Modified)

// @license      MIT

// @match        https://www.geo-fs.com/geofs.php*

// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com

// @grant        GM.getResourceText

// @grant        GM.getResourceUrl

// @resource     airports https://github.com/avramovic/geofs-ai-atc/raw/master/airports.json

// @resource     radiostatic https://github.com/avramovic/geofs-ai-atc/raw/master/radio-static.mp3

// @downloadURL https://update.greasyfork.org/scripts/523624/GeoFS%20AI%20%28GPT%29%20ATC.user.js

// @updateURL https://update.greasyfork.org/scripts/523624/GeoFS%20AI%20%28GPT%29%20ATC.meta.js

// ==/UserScript==



(function() {

    'use strict';



    const head = document.querySelector('head');

    if (head) {

        const puterJS = document.createElement('script');

        puterJS.src = 'https://js.puter.com/v2/';

        head.appendChild(puterJS);



        const growlJS = document.createElement('script');

        growlJS.src = 'https://cdn.jsdelivr.net/gh/avramovic/geofs-ai-atc@master/vanilla-notify.min.js';

        head.appendChild(growlJS);



        const growlCSS = document.createElement('link');

        growlCSS.href = 'https://cdn.jsdelivr.net/gh/avramovic/geofs-ai-atc@master/vanilla-notify.css';

        growlCSS.rel = 'stylesheet';

        head.appendChild(growlCSS);

    }



    let airports;

    GM.getResourceText("airports").then((data) => {

        airports = JSON.parse(data);

    });



    let radiostatic;

    GM.getResourceUrl("radiostatic").then((data) => {

        radiostatic = new Audio('data:audio/mp3;'+data);

        radiostatic.loop = false;

    });



    let tunedInAtc;

    let controllers = {};

    let context = {};

    let oldNearest = null;

    let isListening = false;

    let recognitionInstance = null;

    let atcButtonGlobalRef = null;

    let statusIndicatorRef = null;

    let currentTranscript = '';



    let atcKeybind = localStorage.getItem('geofs_ai_atc_key') || 'KeyT';

    let joystickButtonIndex = parseInt(localStorage.getItem('geofs_ai_atc_joy_btn') ?? '2', 10); // Default to Button 3 (index 2)



    // --- Core Speech Recognition Controls ---

    function startListening(btn) {

        if (typeof tunedInAtc === 'undefined') {

            error("No frequency set. Click the radio icon to set the frequency!");

            return;

        }



        let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            error("Speech recognition is not supported in this browser.");

            return;

        }



        if (isListening) return;



        navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {

            let recognition = new SpeechRecognition();

            recognitionInstance = recognition;

            recognition.continuous = true;

            recognition.lang = 'en-US';

            recognition.interimResults = true;

            recognition.maxAlternatives = 1;



            currentTranscript = '';



            recognition.onstart = () => {

                isListening = true;

                if (btn) btn.style.color = '#ff4444';

                if (statusIndicatorRef) {

                    statusIndicatorRef.style.display = 'block';

                    statusIndicatorRef.innerText = '🔴 ATC TRANSMITTING...';

                }

            };



            recognition.onresult = (event) => {

                let interim = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {

                    if (event.results[i].isFinal) {

                        currentTranscript += event.results[i][0].transcript + ' ';

                    } else {

                        interim += event.results[i][0].transcript;

                    }

                }

                if (statusIndicatorRef && interim) {

                    statusIndicatorRef.innerText = `🔴 "${interim}"`;

                }

            };



            recognition.onerror = (event) => {

                error('Speech recognition error: ' + event.error);

                stopListening(btn);

            };



            recognition.start();

        }).catch(() => {

            error("Microphone access denied or unavailable.");

        });

    }



    function stopListening(btn) {

        if (!isListening) return;

        isListening = false;

        if (btn) btn.style.color = '';

        if (statusIndicatorRef) {

            statusIndicatorRef.style.display = 'none';

        }



        if (recognitionInstance) {

            try {

                recognitionInstance.stop();

            } catch (e) {}

            recognitionInstance = null;

        }



        let pilotMsg = currentTranscript.trim();

        if (pilotMsg != "") {

            callAtc(pilotMsg);

        } else {

            error("No speech recognized.");

        }

        currentTranscript = '';

    }



    const observer = new MutationObserver(() => {

        const menuList = document.querySelector('div.geofs-ui-bottom');



        if (menuList && !menuList.querySelector('.geofs-atc-icon')) {

            const micIcon = document.createElement('i');

            micIcon.className = 'material-icons';

            micIcon.innerText = 'headset';



            const knobIcon = document.createElement('i');

            knobIcon.className = 'material-icons';

            knobIcon.innerText = 'radio';



            // --- Status Badge Popup ---

            const statusBadge = document.createElement('div');

            statusBadge.style.cssText = "display: none; position: absolute; bottom: 50px; right: 0; background: rgba(0,0,0,0.85); color: #ff4444; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 13px; z-index: 9999; white-space: nowrap;";

            statusBadge.innerText = "🔴 ATC TRANSMITTING...";

            statusIndicatorRef = statusBadge;



            const buttonContainer = document.createElement('div');

            buttonContainer.style.cssText = "position: relative; display: inline-block;";



            const tuneInButton = document.createElement('button');

            tuneInButton.className = 'mdl-button mdl-js-button mdl-button--icon geofs-f-standard-ui geofs-tunein-icon';

            tuneInButton.title = "Click to set ATC frequency.";



            tuneInButton.addEventListener('click', () => {

                let nearestAp = findNearestAirport();

                let apCode = prompt('Enter airport ICAO code', nearestAp.code);

                if (apCode == null || apCode === '') {

                    error('You cancelled the dialog.');

                } else {

                    apCode = apCode.toUpperCase();

                    if (typeof unsafeWindow.geofs.mainAirportList[apCode] === 'undefined') {

                        error('Airport with code '+ apCode + ' can not be found!');

                    } else {

                        tunedInAtc = apCode;

                        initController(apCode);

                        info('Your radio is now tuned to '+apCode+' frequency. You will now talk to them.');

                    }

                }

            });



            const atcButton = document.createElement('button');

            atcButton.className = 'mdl-button mdl-js-button mdl-button--icon geofs-f-standard-ui geofs-atc-icon';

            atcButton.title = `Hold key (${atcKeybind.replace('Key', '')}) or Joystick Button 3 to talk to ATC. Ctrl+click for text input.`;



            atcButtonGlobalRef = atcButton;



            atcButton.addEventListener('click', (e) => {

                if (e.ctrlKey || e.metaKey) {

                    let pilotMsg = prompt("Please enter your message to the ATC:");

                    if (pilotMsg != null && pilotMsg != "") {

                        callAtc(pilotMsg);

                    } else {

                        error("You cancelled the dialog");

                    }

                }

            });



            atcButton.appendChild(micIcon);

            tuneInButton.appendChild(knobIcon);

            buttonContainer.appendChild(statusBadge);

            buttonContainer.appendChild(tuneInButton);

            buttonContainer.appendChild(atcButton);

            menuList.appendChild(buttonContainer);

        }



        // --- Hook into GeoFS Options panel ---

        const optionsPanel = document.querySelector('.geofs-options-content, .geofs-stop-panel, div[data-action="options"]');

        if (optionsPanel && !document.getElementById('ai-atc-controls-section')) {

            const customSection = document.createElement('div');

            customSection.id = 'ai-atc-controls-section';

            customSection.style.cssText = "margin-top: 15px; padding-top: 10px; border-top: 1px solid #555;";

            customSection.innerHTML = `

                <label style="display: block; font-weight: bold; margin-bottom: 5px;">AI ATC Keyboard Hotkey</label>

                <input type="text" id="ai-atc-key-input" value="${atcKeybind.replace('Key', '')}" maxlength="1" style="width: 50px; text-align: center; padding: 4px;" title="Type a letter to change hotkey">

                <span style="font-size: 12px; margin-left: 8px;">(Default: T)</span>



                <div style="margin-top: 12px;">

                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Joystick Push-to-Talk Button Index</label>

                    <input type="number" id="ai-atc-joy-input" value="${joystickButtonIndex}" min="0" max="30" style="width: 50px; text-align: center; padding: 4px;" title="Button index (0-indexed: Button 3 is index 2)">

                    <span style="font-size: 12px; margin-left: 8px;">(Note: Button 3 = Index 2)</span>

                </div>

            `;

            optionsPanel.appendChild(customSection);



            const keyInput = document.getElementById('ai-atc-key-input');

            keyInput.addEventListener('keydown', (ev) => {

                ev.preventDefault();

                const newKey = 'Key' + ev.key.toUpperCase();

                atcKeybind = newKey;

                localStorage.setItem('geofs_ai_atc_key', newKey);

                keyInput.value = ev.key.toUpperCase();

                info(`AI ATC hotkey updated to: ${ev.key.toUpperCase()}`);

            });



            const joyInput = document.getElementById('ai-atc-joy-input');

            joyInput.addEventListener('change', () => {

                joystickButtonIndex = parseInt(joyInput.value, 10);

                localStorage.setItem('geofs_ai_atc_joy_btn', joystickButtonIndex);

                info(`Joystick ATC button index updated to ${joystickButtonIndex}`);

            });

        }

    });



    observer.observe(document.body, {childList: true, subtree: true});



    // --- Global Keyboard Hotkey Handlers ---

    window.addEventListener('keydown', (event) => {

        const tagName = document.activeElement ? document.activeElement.tagName : '';

        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || document.activeElement.isContentEditable) return;

        if (event.code === atcKeybind && !event.repeat) {

            event.preventDefault();

            startListening(atcButtonGlobalRef);

        }

    });



    window.addEventListener('keyup', (event) => {

        const tagName = document.activeElement ? document.activeElement.tagName : '';

        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || document.activeElement.isContentEditable) return;

        if (event.code === atcKeybind) {

            event.preventDefault();

            stopListening(atcButtonGlobalRef);

        }

    });



    // --- Direct Gamepad Polling Loop ---

    let previousButtonState = false;

    setInterval(() => {

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

        let currentPressed = false;



        for (let i = 0; i < gamepads.length; i++) {

            const gp = gamepads[i];

            if (gp && gp.buttons && gp.buttons[joystickButtonIndex]) {

                if (gp.buttons[joystickButtonIndex].pressed) {

                    currentPressed = true;

                    break;

                }

            }

        }



        if (currentPressed && !previousButtonState) {

            startListening(atcButtonGlobalRef);

        } else if (!currentPressed && previousButtonState) {

            stopListening(atcButtonGlobalRef);

        }



        previousButtonState = currentPressed;

    }, 40);



    function haversine(lat1, lon1, lat2, lon2) {

        const R = 6371;

        const toRad = (deg) => deg * (Math.PI / 180);

        const dLat = toRad(lat2 - lat1);

        const dLon = toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +

                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return (R * c) / 1.852;

    }



    function findNearestAirport() {

        let nearestAirport = null;

        let minDistance = Infinity;

        for (let apCode in unsafeWindow.geofs.mainAirportList) {

            let distance = findAirportDistance(apCode);

            if (distance < minDistance) {

                minDistance = distance;

                nearestAirport = { code: apCode, distance: distance };

            }

        }

        return nearestAirport;

    }



    function findAirportDistance(code) {

        let aircraftPosition = {

            lat: unsafeWindow.geofs.aircraft.instance.lastLlaLocation[0],

            lon: unsafeWindow.geofs.aircraft.instance.lastLlaLocation[1],

        };

        let ap = unsafeWindow.geofs.mainAirportList[code];

        return haversine(aircraftPosition.lat, aircraftPosition.lon, ap[0], ap[1]);

    }



    function initController(apCode) {

        controllers[apCode] = controllers[apCode] || null;

        if (controllers[apCode] == null) {

            let date = new Date().toISOString().split('T')[0];

            fetch('https://randomuser.me/api/?gender=male&nat=au,br,ca,ch,de,us,dk,fr,gb,in,mx,nl,no,nz,rs,tr,ua,us&seed='+apCode+'-'+date)

              .then(response => response.json())

              .then(json => { controllers[apCode] = json.results[0]; });

        }

    }



    function error(msg) { vNotify.error({text:msg, title:'Error', visibleDuration: 10000}); }

    function info(msg, title) { vNotify.info({text:msg, title: title || 'Information', visibleDuration: 10000}); }



    function atcSpeak(text) {

        let synth = window.speechSynthesis;

        let voices = synth.getVoices();

        let toSpeak = new SpeechSynthesisUtterance(text);

        toSpeak.voice = voices[0];

        synth.speak(toSpeak);

    }



    function atcMessage(text, airport_code) {

        vNotify.warning({text: text, title: airport_code+' ATC', visibleDuration: 20000});

        atcSpeak(text);

    }



    function pilotMessage(text) {

        let user = unsafeWindow.geofs.userRecord;

        let airplane = unsafeWindow.geofs.aircraft.instance.aircraftRecord;

        let callsign = (user.id != 0) ? user.callsign : "Foo";

        vNotify.success({text: text, title: airplane.name+': '+callsign, visibleDuration: 10000});

    }



    setInterval(function() {

        let airport = findNearestAirport();

        let airportMeta = airports[airport.code];

        if (oldNearest !== airport.code) {

            let apName = airportMeta ? airportMeta.name+' ('+airport.code+')' : airport.code;

            info('You are now in range of '+apName+'. Set your radio frequency to <b>'+airport.code+'</b> to tune in with them');

            oldNearest = airport.code;

            initController(airport.code);

        }

    }, 500);



    function callAtc(pilotMsg) {

        let airport = { distance: findAirportDistance(tunedInAtc), code: tunedInAtc };

        let date = new Date().toISOString().split('T')[0];

        let time = unsafeWindow.geofs.animation.values.hours + ':' + unsafeWindow.geofs.animation.values.minutes;

        let airportMeta = airports[airport.code];

        let controller = controllers[airport.code];

        let apName = airportMeta ? airportMeta.name + ' (' + airport.code + ')' : airport.code;

        let pilot = getPilotInfo(date);



        if (typeof controller === 'undefined') {

            radiostatic.play();

            info('Airport '+apName+' seems to be closed right now. Try again later...');

            initController(airport.code);

            return;

        }



        if (airport.distance > 50) {

            radiostatic.play();

            error('Frequency '+airport.code+' is out of range. You need to be at least 50 nautical miles away from the airport to contact it.');

            return;

        }



        let airportPosition = {

            lat: unsafeWindow.geofs.mainAirportList[airport.code][0],

            lon: unsafeWindow.geofs.mainAirportList[airport.code][1],

        };



        if (typeof context[airport.code] === "undefined") {

            let season = unsafeWindow.geofs.animation.values.season;

            let daynight = unsafeWindow.geofs.animation.values.night ? 'night' : 'day';

            if (unsafeWindow.geofs.isSnow || unsafeWindow.geofs.isSnowy) daynight = 'snowy '+daynight;



            let intro = 'You are '+controller.name.first+' '+controller.name.last+', a '+controller.dob.age+' years old '+controller.gender+' ATC controller on the '+apName+' for today. ' +

                'Your airport location is (lat: '+airportPosition.lat+', lon: '+airportPosition.lon+'). You are talking to pilot whose name is '+pilot.name+' callsign ('+pilot.callsign+') and they\'ve been piloting since '+pilot.licensed_at+'. ' +

                'You will be acting as ground, tower (if the plane is below or at `5000 ft) or approach or departure (if above 5000 ft), depending on whether the plane is on the ground, their distance from the airport, heading and previous context. ' +

                'Today is '+date+', time is '+time+', a beautiful '+season+' '+daynight;



            context[airport.code] = [];

            context[airport.code].push({content: intro, role: 'system'});

        }



        let airplane = unsafeWindow.geofs.aircraft.instance.aircraftRecord;

        let onGround = unsafeWindow.geofs.animation.values.groundContact === 1 ? 'on the ground' : 'in the air';

        let distance = airport.distance > 1 ? `${airport.distance} nautical miles from airport` : 'at the airport';

        let movingSpeed = unsafeWindow.geofs.animation.values.groundContact === 1 ? 'stationary' : `flying at ${unsafeWindow.geofs.animation.values.kias} kts`;



        let currentUpdate = `Date and time: ${date} ${time}. Pilot is flying ${airplane.name} ${onGround} ${distance}, ${movingSpeed}.`;



        if (context[airport.code].length >= 4) {

            context[airport.code].splice(-3, 1);

        }



        context[airport.code].push({content: currentUpdate, role: 'system'});

        context[airport.code].push({content: pilotMsg, role: 'user'});



        pilotMessage(pilotMsg);



        puter.ai.chat(context[airport.code]).then(function(resp) {

            context[airport.code].push(resp.message);

            atcMessage(resp.message.content, airport.code);

        });

    }



    function getPilotInfo(today) {

        let user = unsafeWindow.geofs.userRecord;

        if (user.id != 0) {

            return { callsign: user.callsign, name: user.firstname + ' ' + user.lastname, licensed_at: user.created };

        }

        return { callsign: 'Foo', name: 'not known', licensed_at: today };

    }



})();

