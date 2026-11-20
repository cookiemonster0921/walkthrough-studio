# Architecture and portability

## Current implementation

This is a conventional rendering pipeline coordinated by a person or coding agent. No LLM is called by the Studio.

1. A person or authorised automation captures application states.
2. Screenshots and project.json are kept in a local project folder.
3. The browser validates the manifest and actual image dimensions.
4. `core.js` computes scene time and one camera transform for each frame.
5. `app.js` draws the screenshot and maps annotations through that same transform.
6. Canvas captureStream supplies video frames to MediaRecorder. Optional music is mixed through a Web Audio destination; no microphone is requested.
7. The user downloads a new timestamped video and reviews it. FFmpeg conversion is optional.

Preview is a visual aid; exported video must be checked separately. Real-time browser export can be affected by hardware load, browser policy and encoding support. Hidden-tab export is cancelled, and encoding failures are reported. It is not a deterministic offline frame renderer.

## Dependencies by layer

| Layer | Required capabilities | Optional capabilities |
|---|---|---|
| Local Studio | Desktop browser with local file inputs, Canvas 2D, captureStream and MediaRecorder | Web Audio for a selected music file |
| Agent-assisted editing | Read/write local files and understand the scene schema | Browser or desktop tools for capturing new screens |
| Capture adapter | Node 20+, approved Playwright package/browser, application access | An already authenticated ignored profile |
| Local development | Node 20+ for server and built-in test runner | None of the Studio runtime needs npm packages |
| MP4 conversion | Approved installed FFmpeg | An approved video editor instead |

Windows without Python is the main portability target. You can open the Studio as a local HTML file. If Node or package installation is unavailable, skip the optional utilities and use screenshots from approved browser automation or manual capture. An agent with no screen access cannot obtain application screenshots by prompting alone.

MCP is one possible tool connection, not an architectural requirement. Copilot or another coding agent can edit the project file if its permissions allow it. Tool availability, application login and enterprise approval must be established in that environment; this repository does not provide them.

## What changed from the original experiment

The original workflow used interactive browser calls followed by layered Python/Pillow scripts and FFmpeg. It reused earlier clips and audio, had Mac font paths, and kept some corrected highlight rectangles in code. It was a working one-off production project, not a fresh-machine package.

This prototype introduces a single scene manifest, a browser renderer, optional adapters and a fictional example. It intentionally does not import the original media or claim that the new renderer reproduces every frame of that video. It also does not turn the original interactive capture history into universal automation.

## References

- [MDN: canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream)
- [MDN: MediaRecorder format detection](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)
- [Playwright: screenshots and CSS/device scale](https://playwright.dev/docs/screenshots)
