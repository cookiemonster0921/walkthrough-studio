# Walkthrough Studio

This is a local screenshot-to-video prototype. Keep the browser studio usable without Python, Node, MCP, cloud APIs or external fonts. Node scripts are optional development/capture/conversion utilities.

- Read README.md and docs/architecture.md before changing the pipeline.
- Screenshots and target rectangles share one source-pixel coordinate system. Never use CSS or DOM coordinates without checking them against the saved image.
- Never invent an application screenshot. The bundled example is explicitly fictional and must stay labelled as such.
- Do not capture credentials, personal information, employer data or authentication state into committed files. Keep captures, profiles, music and video exports ignored by Git.
- Never auto-submit forms, click destructive application actions, or publish/upload a video as part of capture. Capture actions require explicit review.
- Changes must preserve existing project manifests or explain a version migration. Write new exports; do not overwrite prior versions by default.
- Run `npm test`, `npm run check -- examples/demo/project.json`, then inspect the preview when rendering or geometry changes.
- Be candid: there is no universal agent harness, automatic UI maintenance, enterprise certification, or automatic redaction built in.

For a new walkthrough: agree the steps, obtain authorised screenshots, write project.json, verify image dimensions, review each highlight in preview, export, then review the resulting video. Authentication is a user handoff. Read docs/capture.md for adapters.
