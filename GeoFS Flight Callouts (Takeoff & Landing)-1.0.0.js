// ==UserScript==
// @name         GeoFS Flight Callouts (Takeoff & Landing)
// @namespace    https://avramovic.info/
// @version      1.0.0
// @description  Automated flight deck voice callouts for GeoFS (V1, Rotate, Gear Up, V2, and Altitude callouts)
// @author       Modified
// @license      MIT
// @match        https://www.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Speech Synthesizer Helper (borrowed from template mechanism) ---
    function speakCallout(text) {
        if (!window.speechSynthesis) return;
        let synth = window.speechSynthesis;
        let voices = synth.getVoices();
        let toSpeak = new SpeechSynthesisUtterance(text);
        toSpeak.rate = 1.0;
        toSpeak.pitch = 1.0;
        if (voices.length > 0) {
            toSpeak.voice = voices[0];
        }
        synth.speak(toSpeak);
    }

    // --- Callout States & Thresholds ---
    // You can adjust these speeds (in knots) to match the aircraft you fly (e.g., Airliners like 737/A320)
    const V1_SPEED = 120;
    const ROTATE_SPEED = 135;
    const V2_SPEED = 145;

    let hasCalledV1 = false;
    let hasCalledRotate = false;
    let hasCalledGearUp = false;
    let hasCalledV2 = false;

    // Altitude callout tracking
    let calledAltitudes = {
        1000: false,
        500: false,
        400: false,
        300: false,
        200: false,
        100: false,
        50: false,
        40: false,
        30: false,
        20: false,
        10: false,
        5: false
    };

    let wasOnGround = true;

    // --- Main Flight Monitoring Loop ---
    setInterval(() => {
        if (typeof unsafeWindow.geofs === 'undefined' || !unsafeWindow.geofs.aircraft || !unsafeWindow.geofs.aircraft.instance) {
            return;
        }

        let values = unsafeWindow.geofs.animation.values;
        if (!values) return;

        let onGround = values.groundContact === 1;
        let speedKias = values.kias || 0;
        // Altitude above ground level or height (GeoFS altitude can be checked via altitude or height values)
        let altAGL = values.height || values.altitude || 0;

        // --- 1. TAKEOFF LOGIC ---
        if (onGround) {
            wasOnGround = true;
            // Reset takeoff callouts when parked or landed
            if (speedKias < 20) {
                hasCalledV1 = false;
                hasCalledRotate = false;
                hasCalledGearUp = false;
                hasCalledV2 = false;
            }
        } else {
            // Just lifted off
            if (wasOnGround) {
                wasOnGround = false;
                // Reset landing altitude flags for the new flight
                resetAltitudeCallouts();
            }

            // Speed-based Takeoff Callouts
            if (!hasCalledV1 && speedKias >= V1_SPEED) {
                speakCallout("V 1");
                hasCalledV1 = true;
            }

            if (!hasCalledRotate && speedKias >= ROTATE_SPEED) {
                speakCallout("Rotate");
                hasCalledRotate = true;
            }

            if (!hasCalledV2 && speedKias >= V2_SPEED) {
                speakCallout("V 2");
                hasCalledV2 = true;
            }

            // Gear Up trigger shortly after rotation/positive climb
            if (hasCalledRotate && !hasCalledGearUp && altAGL > 50) {
                speakCallout("Gear up");
                hasCalledGearUp = true;
            }
        }

        // --- 2. LANDING LOGIC (Descending Altitudes) ---
        // Only trigger altitude callouts when descending (or close to ground and not on takeoff roll)
        if (!onGround && altAGL <= 1050) {
            checkAltitudeCallout(1000, altAGL);
            checkAltitudeCallout(500, altAGL);
            checkAltitudeCallout(400, altAGL);
            checkAltitudeCallout(300, altAGL);
            checkAltitudeCallout(200, altAGL);
            checkAltitudeCallout(100, altAGL);
            checkAltitudeCallout(50, altAGL);
            checkAltitudeCallout(40, altAGL);
            checkAltitudeCallout(30, altAGL);
            checkAltitudeCallout(20, altAGL);
            checkAltitudeCallout(10, altAGL);
            checkAltitudeCallout(5, altAGL);
        }

    }, 100);

    function checkAltitudeCallout(targetAlt, currentAlt) {
        // Trigger when crossing downwards through the threshold
        if (!calledAltitudes[targetAlt] && currentAlt <= targetAlt && currentAlt > (targetAlt - 30)) {
            speakCallout(targetAlt.toString());
            calledAltitudes[targetAlt] = true;
        }
        // Reset if climbing back up through it (e.g. go-around)
        if (currentAlt > targetAlt + 50) {
            calledAltitudes[targetAlt] = false;
        }
    }

    function resetAltitudeCallouts() {
        for (let alt in calledAltitudes) {
            calledAltitudes[alt] = false;
        }
    }

})();