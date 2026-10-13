# AL Pilot v5.1.2 learning pack

Open `AL_Pilot_Atlas/index.html` in your browser. The atlas works offline and covers Validation requests through Workspace settings, with screenshots, interactive labs, a glossary, and a demo script.

| What | Where |
|---|---|
| **Interactive atlas** (double-click, offline) | `AL_Pilot_Atlas/index.html` |
| Same content as one markdown file, with numbered screenshots | `AL_Pilot_v5_1_2_Full_Walkthrough.md` |
| Focused walkthrough with close-up screenshots | `AL_Pilot_v5_1_2_Walkthrough_Focused.md` |
| Sample export from the real Bada Dost (axle 5.13) | `AL_Pilot_Atlas/samples/bada_axle_513_package.zip` |
| Capture / build tooling | `tools/` (`c0*.js` capture scripts, `build.js`, `verify_labs.py`) |

The screenshots use the local v5.1.2 practice application and demo data. Explanation responses shown in the guide are simulated. The practice application, local data, and machine-specific launchers are maintained separately.

After editing atlas content, run `node build.js --no-render` from `tools/` to validate references and regenerate the full walkthrough. A full screenshot rebuild requires `npm ci` and Chrome, followed by `node build.js` and `node build_focused.js`. Capture scripts require the practice application running locally; run them one at a time because they update the same screenshot manifest.

Some tall dialogs have controls below the captured image. The focused walkthrough identifies notes whose controls are outside the picture.
