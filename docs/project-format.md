# Scene format, version 1

`project.json` is the source of truth. Output size, order, titles, seconds and target rectangles live in this file, instead of being spread across renderer revisions.

```json
{
  "version": 1,
  "title": "Training walkthrough",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "footer": "Synthetic example",
  "scenes": [{
    "id": "source",
    "title": "Choose the source dataset",
    "duration": 5,
    "image": "screens/01.png",
    "source": {"width": 3840, "height": 2160},
    "crop": {"x": 1800, "y": 0, "w": 2040, "h": 1148},
    "zoomTo": {"x": 2440, "y": 0, "w": 1400, "h": 800},
    "zoomSeconds": 1,
    "highlights": [{
      "rect": {"x": 2765, "y": 244, "w": 1029, "h": 48},
      "label": "Selected source dataset",
      "side": "left",
      "start": 1.2,
      "end": 5
    }]
  }]
}
```

The numbers above illustrate the format, not a supplied screenshot. Use the bundled demo for a runnable project.

- Every rectangle uses `{x,y,w,h}` in the **saved image's pixels**, measured from its top-left corner.
- `source` must match the actual image's natural dimensions. The browser rejects mismatches instead of guessing how to rescale targets.
- `crop` and `zoomTo` are optional. Both must fit inside the source. Missing crop uses the whole image. Missing zoomTo holds the crop still.
- The renderer preserves aspect ratio, adds letterboxing if necessary, and limits enlargement to 1.5 output pixels per source pixel.
- `zoomSeconds` defaults to 1. Highlights use scene-local seconds. End times are exclusive.
- Use at most two highlight entries per scene. If their display times overlap, use opposite label sides. More detail belongs in another scene.
- Image paths must be local, relative paths using forward slashes on every operating system. The folder picker preserves subfolders. The flat files picker is suitable only when manifest image paths are plain, unique filenames.
- Keep source screenshots unchanged after measuring targets. Cropping, resizing, browser zoom, device scale and layout changes can invalidate every target rectangle.

DOM bounds are provisional evidence. Confirm the saved-image border of the intended control: a filename text span is not the whole selected row, and a heading-plus-dropdown container is not the dropdown itself. Review label placement and motion in the preview, then inspect the encoded result.
