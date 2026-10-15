# Q-SYS Panel Workbench

Angular app that emulates a 10.1" (1280×800) touch panel and connects to a Q-SYS Core
over [QRWC](https://www.npmjs.com/package/@q-sys/qrwc) (`@q-sys/qrwc`).

```bash
npm install
npm start        # http://localhost:4200
```

Enter the Core's IP on the right-hand panel and press **Connect**.

## Presentation

`http://localhost:4200/present` is a 13-slide deck about how this was built with Claude Code.
→ / Space / PageDown (clickers) next, ← / PageUp back, **F** fullscreen, **D** or Enter on the last
slide to jump to the live panel. The workbench header has a *Presentation* link back. Connect to the
Core before you present: the connection stays up while you move between the deck and the demo.

## Layout

| Path | What it is |
| --- | --- |
| `src/app/core/qsys.service.ts` | Single QRWC connection; exposes state, engine status, components and a log as signals. `instance` gives the live `Qrwc` for controls. |
| `src/app/touch-panel/` | The hardware mock-up. Renders its content at native 1280×800 and scales to fit. |
| `src/app/panel-app/` | The UI that runs *on* the panel screen: `pages/` (Home, Audio, Video, Camera) and `widgets/` (fader, toggle, momentary, meter, camera snapshot, source select). |
| `src/app/core/qsys-control.ts` | Reactive control handle from `qsys.control('MainGain', 'gain')`: `state`/`bool`/`position`/`string` signals plus `set()`, `toggle()`, `trigger()`. |
| `src/app/workbench/` | The demo page (`/`) and its connection/diagnostics sidebar. |
| `src/app/presentation/` | The slide deck (`/present`), its typing terminal and count-up helpers. |

## Core requirements

- Q-SYS Designer 10.0+ design running on the Core.
- Components to control must have **Code Access** set to **External** or **All**.
- `ws://` works when this page is served over plain http. Browsers block `ws://` from an
  https page, and `wss://` needs a CA-signed certificate on the Core (the default self-signed
  cert will be rejected by the browser).
- Access key is only needed if Core access control is enabled. The IP and key are saved in the
  browser's localStorage to pre-fill the form; the panel never connects until you press Connect.
