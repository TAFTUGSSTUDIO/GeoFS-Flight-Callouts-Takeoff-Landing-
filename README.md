# ✈️ GeoFS Precise Flight Callouts & Ad Removal

A feature-rich Tampermonkey userscript for [GeoFS](https://www.geo-fs.com/) that adds realistic speech callouts, intelligent takeoff/landing sequences, fixed/retractable gear checks, and built-in ad removal.

## 🚀 Features

- **Speech Synthesis Callouts:** Uses your browser's built-in text-to-speech engine for crisp, clear audio callouts.
- **Dynamic Takeoff Sequence (`V1` $\rightarrow$ `Rotate` $\rightarrow$ `V2`):** Speeds are automatically configured based on the aircraft you are flying (Airliners, Jets, GA aircraft, etc.).
- **Smart Gear Up Detection:** Prevents false triggers on bumpy runways by confirming a stable positive climb before calling "Gear Up". Fixed-gear aircraft (like the Cessna 152 or Cubs) automatically bypass the gear callout.
- **Landing Altimeter Callouts:** Counts down altitude from 2,500 feet down to 5 feet on final approach.
- **UI Toggle Button:** Adds a dedicated `🔇 Callouts: OFF / 🔊 Callouts: ON` button to the GeoFS bottom menu bar.

## 📦 Installation

1. Install a userscript manager like **Tampermonkey** (recommended) or Violentmonkey in your browser.
2. Create a new userscript and paste the code from `script.js`.
3. Open or refresh GeoFS (`https://www.geo-fs.com/geofs.php`).
4. Click the **Callouts** button on the bottom menu to enable audio.

## ⚙️ Customization
You can tweak the default V1 speeds or timing delays directly inside the script code under `getAircraftInfo()` and the takeoff timers.

## 📜 Credits & License
- Ad removal based on community scripts.
- Licensed under the **MIT License**.









# GeoFS AI ATC (Joystick & Gamepad Edition)

An enhanced userscript for [GeoFS](https://www.geo-fs.com/) that integrates **AI-powered Air Traffic Control (ATC)** using Puter.js AI and browser speech recognition. This version adds direct **gamepad/joystick push-to-talk (PTT) synchronization**, allowing you to talk to ATC seamlessly using your physical joystick buttons without conflict.

---

## Features

* **AI-Powered ATC:** Communicate naturally with dynamic AI-driven controllers tailored to your nearest airport.
* **Direct Gamepad Polling:** Bypasses clunky menu conflicts by reading your joystick button states directly.
* **Voice Recognition:** Hold down your hotkey or joystick button to speak directly to the tower with live interim transcription feedback.
* **Automatic Frequency Tuning:** Detects nearby airports and allows you to tune your radio frequency on the fly.
* **Fallback Text Mode:** Hold `Ctrl` and click the mic icon if you prefer typing your messages.

---

## Prerequisites

Before installing, make sure you have:
1. A userscript manager installed in your browser (such as **Tampermonkey** or **Violentmonkey**).
2. A microphone and a modern browser that supports the Web Speech API (Chrome, Edge, etc.).
3. A connected USB joystick, yoke, or game controller.

---

## Installation

1. Open your userscript manager dashboard.
2. Create a new userscript.
3. Copy and paste the code from `geofs-ai-atc.user.js` into the editor.
4. Save the script and navigate to [GeoFS](https://www.geo-fs.com/geofs.php). The radio and headset icons will automatically appear in your bottom UI toolbar.

---

## Configuration & Usage

### 1. Tuning Your Frequency
* Click the **Radio Knob icon** at the bottom toolbar.
* Enter the ICAO code of the airport you want to talk to (e.g., `ENGM` or `KSFO`), or leave the automatic nearest airport suggestion.

### 2. Push-to-Talk (PTT) Options
You can talk to the ATC using any of these methods:
* **Keyboard Hotkey:** Press and hold **`T`** (you can change this in the GeoFS options menu).
* **Joystick Button:** Press and hold your physical joystick button (default is mapped to **Button 3**, which corresponds to index `2`).

### 3. Customizing Your Joystick Button Index
If your joystick uses a different button for PTT:
1. Open the **GeoFS Options menu** while in-game.
2. Scroll to the **AI ATC Controls** section.
3. Change the **Joystick Push-to-Talk Button Index** to match your desired button. *(Note: JavaScript uses 0-indexing, so Button 1 = Index 0, Button 3 = Index 2).*

---

## Credits & Acknowledgments

* **Original Script:** [Nemanja Avramovic](https://avramovic.info/) ([Original GitHub Repository](https://github.com/avramovic/geofs-ai-atc))
* **AI Provider:** [Puter.js](https://puter.com/)

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).
