# The cat in 3D (Blender → three.js)

Everything is built by script, so the model is reproducible and reviewable in git.

| File | What |
|---|---|
| `build_cat.py` | Mesh (Skin modifier body + head, eyes, ears, nose, whiskers), quadruped armature with IK paws, weights. Writes `assets/cat3d/cat.blend` and `public/models/cat.glb`. |
| `animate.py` | Body actions: `Stand`, `Sit`, `Walk` (lateral-sequence cycle, paws planted by IK). Posed by direction (`aim`) and paw placement (`place`). |
| `preview.py` | Cycles renders (front / side / three-quarter) of any action frame, for comparison with `assets/reference/cat-sheet.jpg`. |
| `sheet.py` | Puts preview PNGs side by side on the sheet's grey. |

Blender runs as a Python module (`bpy` 5.3, Python 3.13), no UI needed:

```bash
python3 -m venv .venv-blender && .venv-blender/bin/pip install bpy==5.3.0
.venv-blender/bin/python scripts/cat3d/build_cat.py
.venv-blender/bin/python scripts/cat3d/preview.py /tmp/cat Sit Walk:7
```

Blink, gaze, ear flicks, tail sway and breathing are not baked: `src/components/cat/three/catScene.ts`
adds them live on top of the actions. Review page: `/pt/cat-lab` (noindex, unlinked).

Gotcha: any mirrored basis (determinant −1) flips face winding. Blender renders both sides, three.js
culls back faces, so a mirrored part disappears in the browser only (it happened to the eyes).
