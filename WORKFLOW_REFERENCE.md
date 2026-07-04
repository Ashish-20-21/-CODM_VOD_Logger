# CODM VOD Logger - Recommended Workflow and Reference Guide

## Recommended way to proceed

When you want to modify or troubleshoot this project, use this order:

1. Start with the main UI shell in [codm_vod_logger_modular/index.html](codm_vod_logger_modular/index.html)
2. Check shared state in [codm_vod_logger_modular/js/state.js](codm_vod_logger_modular/js/state.js)
3. Review the app bootstrap and event hooks in [codm_vod_logger_modular/js/main.js](codm_vod_logger_modular/js/main.js)
4. Go to the relevant mode file:
   - Hardpoint: [codm_vod_logger_modular/js/hardpoint.js](codm_vod_logger_modular/js/hardpoint.js)
   - Search & Destroy: [codm_vod_logger_modular/js/snd.js](codm_vod_logger_modular/js/snd.js)
   - Control: [codm_vod_logger_modular/js/control.js](codm_vod_logger_modular/js/control.js)
5. If needed, adjust the review display in [codm_vod_logger_modular/js/verify.js](codm_vod_logger_modular/js/verify.js)
6. If needed, update exports in [codm_vod_logger_modular/js/export.js](codm_vod_logger_modular/js/export.js)

This order keeps edits organized and prevents accidental breakage.

---

## Quick reference: the 5 files to open first

When you need to modify something, these are the best starting points:

1. **Main layout / UI structure**
   [codm_vod_logger_modular/index.html](codm_vod_logger_modular/index.html)
   Use this for adding new fields, changing panel layout, or wiring new buttons.

2. **Global app startup and event hooks**
   [codm_vod_logger_modular/js/main.js](codm_vod_logger_modular/js/main.js)
   Use this when you want to change tab behavior, startup initialization, export button actions, or match-wide controls.

3. **Shared saved data model**
   [codm_vod_logger_modular/js/state.js](codm_vod_logger_modular/js/state.js)
   Use this when you need to add a new stored setting, a new data section, or modify the default schema.

4. **Mode-specific logic**
   - Hardpoint: [codm_vod_logger_modular/js/hardpoint.js](codm_vod_logger_modular/js/hardpoint.js)
   - Search & Destroy: [codm_vod_logger_modular/js/snd.js](codm_vod_logger_modular/js/snd.js)
   - Control: [codm_vod_logger_modular/js/control.js](codm_vod_logger_modular/js/control.js)

   Use these when you want to fix scoring, add fields, change validation rules, or adjust round behavior.

5. **Review / export output**
   - Verify view: [codm_vod_logger_modular/js/verify.js](codm_vod_logger_modular/js/verify.js)
   - CSV export: [codm_vod_logger_modular/js/export.js](codm_vod_logger_modular/js/export.js)

   Use these when you want to modify what appears in the review pane or what gets exported.

---

## Edit checklist for the most common changes

### 1) Add a new field to a mode

**Example:** add one more input in Hardpoint or S&D

1. Add the input or selector in [codm_vod_logger_modular/index.html](codm_vod_logger_modular/index.html)
2. Add the new field to the saved object in [codm_vod_logger_modular/js/state.js](codm_vod_logger_modular/js/state.js)
3. Read the value in the relevant mode file:
   - [codm_vod_logger_modular/js/hardpoint.js](codm_vod_logger_modular/js/hardpoint.js)
   - [codm_vod_logger_modular/js/snd.js](codm_vod_logger_modular/js/snd.js)
   - [codm_vod_logger_modular/js/control.js](codm_vod_logger_modular/js/control.js)
4. Save it when the user clicks Save
5. Show it in [codm_vod_logger_modular/js/verify.js](codm_vod_logger_modular/js/verify.js)
6. Add it to export headers in [codm_vod_logger_modular/js/export.js](codm_vod_logger_modular/js/export.js)

### 2) Change Hardpoint logic

Start with:

- [codm_vod_logger_modular/js/hardpoint.js](codm_vod_logger_modular/js/hardpoint.js)
- [codm_vod_logger_modular/js/state.js](codm_vod_logger_modular/js/state.js)

Typical changes:
- Hill numbering
- Score limits
- Hill cycle rules
- Notes handling
- Cumulative calculations

### 3) Change Search & Destroy logic

Start with:

- [codm_vod_logger_modular/js/snd.js](codm_vod_logger_modular/js/snd.js)
- [codm_vod_logger_modular/js/state.js](codm_vod_logger_modular/js/state.js)

Typical changes:
- New round methods
- Different first-blood rules
- Winner calculation
- OT or side logic
- Manual result behavior

### 4) Change Control logic

Start with:

- [codm_vod_logger_modular/js/control.js](codm_vod_logger_modular/js/control.js)
- [codm_vod_logger_modular/js/state.js](codm_vod_logger_modular/js/state.js)

Typical changes:
- Streak counting
- Duration clock logic
- All Out handling
- Save validation
- Round structure

### 5) Change the visual layout or look

Start with:

- [codm_vod_logger_modular/styles/main.css](codm_vod_logger_modular/styles/main.css)

Typical changes:
- Button colors
- Panel spacing
- Verify table styling
- Fonts
- Capture bar visuals

### 6) Change export behavior

Start with:

- [codm_vod_logger_modular/js/export.js](codm_vod_logger_modular/js/export.js)

Typical changes:
- CSV header names
- File naming
- Extra columns
- Export only selected mode

---

## Fast “if something breaks” checklist

If a mode stops working, check in this order:

1. [codm_vod_logger_modular/js/main.js](codm_vod_logger_modular/js/main.js)
   Is startup or event wiring okay?

2. The relevant mode file
   - [codm_vod_logger_modular/js/hardpoint.js](codm_vod_logger_modular/js/hardpoint.js)
   - [codm_vod_logger_modular/js/snd.js](codm_vod_logger_modular/js/snd.js)
   - [codm_vod_logger_modular/js/control.js](codm_vod_logger_modular/js/control.js)

3. [codm_vod_logger_modular/js/state.js](codm_vod_logger_modular/js/state.js)
   Did the state schema change unexpectedly?

4. [codm_vod_logger_modular/js/verify.js](codm_vod_logger_modular/js/verify.js)
   Is the review panel loading the right data?

---

## Practical rule of thumb

- If it affects what the user sees → check [codm_vod_logger_modular/index.html](codm_vod_logger_modular/index.html) or [codm_vod_logger_modular/styles/main.css](codm_vod_logger_modular/styles/main.css)
- If it affects what gets saved → check [codm_vod_logger_modular/js/state.js](codm_vod_logger_modular/js/state.js)
- If it affects the round rules → check the specific mode file
- If it affects export or review → check [codm_vod_logger_modular/js/verify.js](codm_vod_logger_modular/js/verify.js) and [codm_vod_logger_modular/js/export.js](codm_vod_logger_modular/js/export.js)
