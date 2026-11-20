# Capture workflow

## Use your existing approved tools

The Studio only needs screenshots and a manifest. Capture may be manual, agent-guided, browser automation, or an approved desktop tool. No capture extension or MCP server is bundled.

1. Agree on the task and the screens worth explaining.
2. Sign in yourself. Do not put credentials or authentication state in the project.
3. Set a consistent application layout and capture lossless PNGs where available.
4. Record each saved image's dimensions. Measure target rectangles in those image pixels.
5. Review screenshots for confidential content. This project does not redact it for you.
6. Write project.json and load the folder in Studio. Review every field border and callout throughout the zoom.

Screenshots alone cannot establish that an action succeeded. Check the actual application outcome before writing the corresponding instruction.

## Optional Playwright adapter

Use only where Node, Playwright and browser installation are approved. The adapter is an example, not a universal workflow recorder.

```sh
npm install --no-save playwright
npx playwright install chromium
npm run serve
# In another terminal:
npm run capture -- capture/plan.example.json
```

The example targets the local Studio. Replace it with reviewed application-specific selectors and actions. The browser opens visibly and pauses for user sign-in before continuing. Each run writes a new ignored `captures/<timestamp>/` folder with screenshots and a draft project.json. Open that folder in the Studio.

The adapter uses `scale: 'css'` so its viewport dimensions and provisional DOM rectangles use the same nominal pixel system. It waits for fonts. These precautions do not prove alignment: inspect the stored image and correct targets, especially if layout, transforms or font rendering changed during capture.

Keep passwords, tokens and sensitive form values out of capture plans. Only add click/fill actions that you are authorised to perform; the adapter cannot determine whether clicking a selector submits an application, deletes a record or changes production data. Never commit its ignored browser profile.

## Review checkpoint

- Correct application state and verified outcome.
- Adequate source resolution, without enlarging a small region to fill the video.
- Targets follow the visible control borders, not unrelated text/container bounds.
- Labels and leader lines avoid covering important controls.
- Written steps remain accurate with voice off.
- Fresh output filename; earlier exports and project versions retained.
