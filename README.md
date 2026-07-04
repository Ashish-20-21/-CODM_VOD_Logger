# CODM VOD Logger - Modular Project Guide

This folder contains a modularized version of the CODM VOD logger app.
It is a browser-based single-page app for logging Hardpoint, Search & Destroy, and Control rounds while watching a YouTube VOD.

## 1) What this project is for

The app helps you:
- Load a YouTube VOD using a link.
- Track Hardpoint hills.
- Track Search & Destroy rounds.
- Track Control round events.
- Review saved entries in the Verify panel.
- Export CSVs for each mode.

The app stores data in browser local storage, so your current session survives reloads unless you click New Match.

---

## 2) High-level folder structure

codm_vod_logger_modular/
- index.html
- styles/
  - main.css
- js/
  - main.js
  - state.js
  - youtube.js
  - hardpoint.js
  - snd.js
  - control.js
  - verify.js
  - export.js
  - utils.js

---

## 3) Main entry point and runtime flow

### index.html
This is the app shell.
It defines:
- Top bar with YT Link, Match ID, Team, Opponent, Hill Cycle, Roster, and New Match.
- Video area.
- Tabbed mode panels: Hardpoint, Search & Destroy, Control.
- Verify box for reviewing current logs.
- Export buttons.
- The module entry:
  - <script type="module" src="./js/main.js"></script>

### js/main.js
This is the controller/bootstrap file.
It is the first JavaScript file that runs after the page loads.

Responsibilities:
- Imports all major modules.
- Initializes the YouTube loader.
- Initializes mode-specific logic.
- Wires global UI events such as:
  - New Match
  - Tab switching
  - Match metadata input changes
  - Export buttons
- Calls renderAll() at startup.

If you want to change global behavior, this file is usually the first place to inspect.

---

## 4) File-by-file explanation

### index.html
Purpose:
- Blank shell / layout of the app.
- Holds all visible UI containers, panels, and buttons.
- Loads the stylesheet and the main module script.

When to edit:
- Add a new button or field.
- Change panel layout.
- Add a new mode tab.
- Adjust IDs used by JS logic.

Important note:
- If you add or rename an element ID, update the matching selector in the related JS file.

### styles/main.css
Purpose:
- All UI colors, spacing, layout, table styles, buttons, toast styling, panel styling, and control bar visuals.

When to edit:
- Change look and feel.
- Adjust spacing or responsive behavior.
- Fix a visual bug in a panel.

Important note:
- This file is not feature logic; it only styles the existing UI.

### js/state.js
Purpose:
- Central application state store.
- Persistent storage wrapper.
- Default schema definition.

Key exports:
- defaultState()
- getState()
- setState()
- loadState()
- persist()
- STORAGE_KEY

What is stored:
- matchId
- team
- opponent
- hillCycle
- roster
- activeMode
- hp.rows
- snd.rows
- control.roundNum, events, rounds

When to edit:
- Add a new setting.
- Add a new top-level data bucket for a new mode.
- Change persistence key or defaults.

Important note:
- This is the single source of truth for app state.
- Most modules read and write state through this file.

### js/youtube.js
Purpose:
- Handles loading and controlling the embedded YouTube player.

Key exports:
- initYoutube()
- onYouTubeApiReady()
- getVideoSeconds()

What it does:
- Reads the pasted YouTube URL.
- Parses a video ID.
- Creates the YouTube player when the API is ready.
- Returns current playback time for event logging.

When to edit:
- Change button behavior on load.
- Modify autoplay, playback settings, or player behavior.
- Add time-based validation or video metadata logic.

Important note:
- It depends on the external YouTube IFrame API loaded from the page.

### js/hardpoint.js
Purpose:
- Handles all Hardpoint mode logic.

Key exports:
- hpComputeRows()
- currentHillNum()
- renderHP()
- initHardpoint()

What it does:
- Computes cumulative scores and hill stats.
- Tracks the next hill number using the hill cycle.
- Saves a Hill row.
- Updates the visible hill number display.

When to edit:
- Change hill numbering logic.
- Modify score validation rules.
- Add extra fields in the Hardpoint panel.
- Adjust display calculations.

Important note:
- Hardpoint data is stored under getState().hp.rows.

### js/snd.js
Purpose:
- Handles Search & Destroy mode logic.

Key exports:
- populateSndPlayerDropdown()
- sndMethodLabel()
- sndDeriveWinner()
- sndComputeRows()
- renderSnd()
- initSnd()

What it does:
- Populates the first-blood player dropdown using roster names.
- Handles manual first-blood input.
- Derives the round winner from the chosen method.
- Saves a round row.
- Updates the round counter.

When to edit:
- Add a new S&D method.
- Change winner calculation.
- Add custom fields to the round form.
- Modify round summary rendering.

Important note:
- S&D rows are stored under getState().snd.rows.

### js/control.js
Purpose:
- Handles Control mode event logging and round save flow.

Key exports:
- controlComputeRound()
- ctrlCurrentComputed()
- renderControlBars()
- tapStreakNumFor()
- streakDurationFor()
- renderControlMiniLog()
- renderControlHeaderReadouts()
- initControl()

What it does:
- Records Round Start, Site A and B taps, and All Out events.
- Tracks stacks and durations.
- Updates the visual capture bars.
- Shows a mini event log for the current round.
- Saves complete control rounds into history.

When to edit:
- Adjust control scoring logic.
- Change how streaks and durations are measured.
- Add event types or new UI controls.
- Fix control-specific validations.

Important note:
- Control rounds are stored under getState().control.rounds.
- Current unsaved round events are stored under getState().control.events.

### js/verify.js
Purpose:
- Builds the review/verification panel content.

Key exports:
- emptyDiv()
- renderVerifyBox()

What it does:
- Shows saved Hardpoint hills, S&D rounds, or Control rounds depending on active mode.
- Provides inline editing and deletion actions for several rows.
- Shows nested event data for Control rounds.

When to edit:
- Change the verify table layout.
- Add custom review fields.
- Change delete/edit behavior in the review panel.

Important note:
- This file depends on the other mode computation functions.

### js/export.js
Purpose:
- Export logic for CSV downloads.

Key exports:
- exportHp()
- exportSnd()
- exportControlRounds()
- exportControlEvents()

What it does:
- Builds CSV content for:
  - Hardpoint
  - Search & Destroy
  - Control rounds
  - Control events
- Downloads the file in the browser.

When to edit:
- Add new exported columns.
- Change CSV filename format.
- Adjust export semantics or headers.

### js/utils.js
Purpose:
- Small shared utility functions.

Key exports:
- fmtTime()
- showToast()
- csvEscape()
- rowsToCsv()
- downloadCsv()
- parseYouTubeId()

When to edit:
- Add helper functions used by multiple modules.
- Adjust toast behavior or time formatting.
- Improve link parsing or export formatting.

---

## 5) How the app data flows

1. User loads a YouTube link.
2. youtube.js parses the ID and loads the player.
3. User switches to a mode and logs entries.
4. The related module reads/writes to getState().
5. persist() saves the state to localStorage after a short debounce.
6. renderVerifyBox() updates the review panel.
7. Export functions generate CSVs from the saved state.

A simple mental model is:
- UI inputs in index.html collect values.
- Mode files handle saved logic.
- state.js is the shared memory.
- verify.js shows the current memory in table form.
- export.js writes the memory to files.

---

## 6) Recommended places to change things

### If you want to add a new mode
1. Add a new panel in index.html.
2. Add a new state section in state.js.
3. Create a new mode module in js/.
4. Initialize it in main.js.
5. Add render and verify support.
6. Add export handling in export.js.

### If you want to add a field to an existing mode
1. Add the control in index.html.
2. Read/write it in the relevant mode file.
3. Include it in the saved object structure.
4. Show it in verify.js if needed.
5. Add it to export.js if it should be exported.

### If you want to fix a UI bug
- Check styles/main.css first for layout/visibility problems.
- Check the related mode file for event wiring.
- Check main.js for missed initialization or event binding.

### If you want to fix a logic bug in a mode
- Start with the corresponding file:
  - Hardpoint -> js/hardpoint.js
  - S&D -> js/snd.js
  - Control -> js/control.js
- Then confirm the state shape in js/state.js.

---

## 7) Common development workflow

### Run locally

**This is required, not optional.** With ES modules (`type="module"`), browsers
refuse to load JavaScript at all from a double-clicked `file://` page — this
is stricter than the earlier single-file version, where only the YouTube
embed broke on `file://`. Opening `index.html` directly will show a blank,
non-functional page. A banner in the page itself detects this automatically
and shows the same instructions below.

From the project folder, use a simple local server:

python -m http.server 8080

Then open:
http://localhost:8080/index.html

Keep the terminal window open while using the tool.

### Useful debugging tips
- Check browser console for import/runtime errors.
- Use the Verify panel to inspect saved state visually.
- Use localStorage key:
  - codm_vod_logger_state_v1
- If a panel stops updating, check whether the corresponding render function is called from the relevant save handler or main render cycle.

---

## 8) Important internal notes

- The app is intentionally split into modules.
- No bundler is required.
- The app uses plain browser ES modules.
- The current persistence layer is browser local storage.
- The working match data should be reset using New Match.

---

## 9) Quick reference map

- Want to change the main layout? -> index.html
- Want to change colors or panel styles? -> styles/main.css
- Want to change global boot behavior? -> js/main.js
- Want to change saved data shape? -> js/state.js
- Want to change YouTube loading behavior? -> js/youtube.js
- Want to change Hardpoint scoring or flow? -> js/hardpoint.js
- Want to change S&D round rules or dropdowns? -> js/snd.js
- Want to change Control event behavior? -> js/control.js
- Want to change review tables? -> js/verify.js
- Want to change CSV export format? -> js/export.js
- Want to add a helper? -> js/utils.js

---

## 10) Summary

This project is structured so that each major concern lives in a separate file:
- Shell/UI: index.html
- Styling: styles/main.css
- App bootstrap: js/main.js
- Shared state: js/state.js
- Video engine: js/youtube.js
- Feature modules: js/hardpoint.js, js/snd.js, js/control.js
- Review panel: js/verify.js
- Exporting: js/export.js
- Shared helpers: js/utils.js

That is the main reason this modular version is easier to maintain than a single giant file.
If you need to modify something, start from the mode-specific file, then check state.js and main.js if the behavior is not wired correctly.
