# Q-SYS Panel Workbench

Angular app that emulates a 10.1" (1280×800) touch panel and connects to a Q-SYS Core
over [QRWC](https://www.npmjs.com/package/@q-sys/qrwc) (`@q-sys/qrwc`).

```bash
npm install
npm start        # http://localhost:4200
```

Enter the Core's IP on the right-hand panel and press **Connect**.

## Layout

| Path | What it is |
| --- | --- |
| `src/app/core/qsys.service.ts` | Single QRWC connection; exposes state, engine status, components and a log as signals. `instance` gives the live `Qrwc` for controls. |
| `src/app/touch-panel/` | The hardware mock-up. Renders its content at native 1280×800 and scales to fit. |
| `src/app/panel-app/` | The UI that runs *on* the panel screen: `pages/` (Home, Audio, Video, Camera) and `widgets/` (fader, toggle, momentary, meter, camera snapshot, source select). |
| `src/app/core/qsys-control.ts` | Reactive control handle from `qsys.control('MainGain', 'gain')`: `state`/`bool`/`position`/`string` signals plus `set()`, `toggle()`, `trigger()`. |
| `src/app/workbench/` | Connection/diagnostics sidebar (IP, protocol, access key, engine status, components, log). |

## Core requirements

- Q-SYS Designer 10.0+ design running on the Core.
- Components to control must have **Code Access** set to **External** or **All**.
- `ws://` works when this page is served over plain http. Browsers block `ws://` from an
  https page, and `wss://` needs a CA-signed certificate on the Core (the default self-signed
  cert will be rejected by the browser).
- Access key is only needed if Core access control is enabled; it is not saved.
