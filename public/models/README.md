# Hero owl model slot

The hero owl is **built in code** by default. See
`src/components/hero/ProceduralOwl.tsx` and `src/components/hero/owlGeometry.ts`.
Nothing in this directory is fetched unless you opt in.

## Using an authored model instead

1. Export the owl as **glTF-Binary (`.glb`)**, compressed with Meshopt.
2. Put it here, e.g. `public/models/owl.glb`.
3. Set the env var and restart the dev server:

   ```
   VITE_OWL_MODEL_URL=/models/owl.glb
   ```

`OwlModel.tsx` centres the model and scales it to the procedural owl's height
(`OWL_HEIGHT`), so the hero framing, the reticle and all three motions keep
working without further tuning.

## Constraints

| Requirement | Target                                  |
| ----------- | --------------------------------------- |
| Format      | `.glb`, Meshopt compressed              |
| File size   | ≤ 400 kB                                |
| Triangles   | ≤ 15k                                   |
| Textures    | none, or one ≤ 1k baked map             |
| Materials   | PBR metal/rough; keep gold at `#e9b45c` |
| Orientation | +Y up, facing +Z                        |
| Origin      | anywhere; the loader recentres it       |

Draco is deliberately disabled. Meshopt support is bundled with the optional
model chunk and works under the production Content Security Policy without a
third-party decoder request.
