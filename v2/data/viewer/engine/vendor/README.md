# Vendored Engine Packages

Self-contained copies of the ExifTool WASM engine used by `engine/worker.js`.
This directory exists so the extension does not depend on
`engine/externals/node_modules/`, which will be removed later.

## Source packages

| Package | Version | Files copied |
|---|---|---|
| `@uswriting/exiftool` | v1.0.9 (ExifTool CLI 13.42) | `dist/esm/index.js` |
| `@6over3/zeroperl-ts` | (as pinned by `@uswriting/exiftool` v1.0.9) | `dist/esm/index.js`, `dist/esm/zeroperl.wasm` |

Copied on 2026-09-27 from `engine/externals/node_modules/`.

## Modifications applied (only to the copies, never to `node_modules`)

`vendor/@uswriting/exiftool/dist/esm/index.js` line 1:

```diff
-import {MemoryFileSystem as O, ZeroPerl as E} from "@6over3/zeroperl-ts"
+import {MemoryFileSystem as O, ZeroPerl as E} from "../../../../@6over3/zeroperl-ts/dist/esm/index.js"
```

Reason: browsers (and extension module workers) cannot resolve bare package
specifiers like `@6over3/zeroperl-ts`; package imports only work in Node with
`package.json` files, which the vendored tree does not contain. Rewriting the
import to a relative path makes the bundle loadable in a browser module worker.

No other files in this directory were changed.

## Update procedure

1. Download / install updated packages (e.g. `npm install @uswriting/exiftool`)
   somewhere outside this extension.
2. Copy their fresh `dist/esm` files over the ones in this directory:
   - `@uswriting/exiftool/dist/esm/index.js`
   - `@6over3/zeroperl-ts/dist/esm/index.js`
   - `@6over3/zeroperl-ts/dist/esm/zeroperl.wasm`
3. Re-apply the import rewrite from the diff above in
   `@uswriting/exiftool/dist/esm/index.js` (note: the relative path must be
   adjusted if `@6over3/zeroperl-ts` publishes from a different depth).
4. Sanity check that no bare specifiers remain in any `index.js` here:
   `grep -rn 'from"@' engine/vendor/` should return nothing.
5. Verify the engine still returns the version, then update the version table
   above.
