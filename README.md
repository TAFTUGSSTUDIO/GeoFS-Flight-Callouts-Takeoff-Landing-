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
