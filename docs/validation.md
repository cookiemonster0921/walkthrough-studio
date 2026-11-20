# Validation record

Initial prototype validation, 20 November 2026:

- Nine Node built-in tests pass: source-size mismatch rejection, shared camera mapping, known control coordinates, aspect ratio and enlargement limit, scene boundaries, invalid asset paths, out-of-bounds targets, format selection, clipping and label collision rules.
- The fictional example manifest passes the command-line check: three scenes, 12 seconds.
- Browser smoke test loaded the local demo, played the preview, and exported a silent 1920×1080 VP9 WebM.
- The exported file contains 359 video packets from 0.000 to 11.978 seconds, consistent with the 12-second demo at approximately 30 fps.
- The optional FFmpeg utility converted that export to H.264 MP4. The resulting MP4 decoded without errors. A frame from that export is included as `docs/demo-frame.png`.
- The previously produced application demo, employer material, original screenshots, authentication profiles and music were not copied into this repository.

Not yet verified: managed Windows deployment, file-folder picker policies in enterprise browsers, every browser/codec combination, optional music export, or the Playwright adapter against a real application. These require tests in the intended environment. No production-readiness or enterprise-compliance claim is made.

Some browser-created WebM files omit duration metadata until remuxed or converted. This is distinct from the frame timestamp span. If a distribution platform requires a seekable MP4, use an approved converter and inspect that final file.
