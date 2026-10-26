// Post-process the emitted declaration files in dist/types:
//  1. `import "...css";` side-effect lines are removed. The library entries
//     import the stylesheet so Vite emits dist/style.css, but a consumer's
//     TypeScript must not try to resolve a CSS module from a .d.ts (TS 5.6's
//     noUncheckedSideEffectImports would even error on it).
//  2. tsc-alias rewrites `@/x` to the real file it found, `./x.d.ts`. Consumers
//     expect `./x.js` (TypeScript maps that to x.d.ts under every resolution
//     mode, including node16), so normalise the extension.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".d.ts")) {
      const src = readFileSync(p, "utf8");
      const out = src
        .replace(/^import\s+"[^"]+\.css";\s*$/gm, "")
        .replace(/(from\s+"\.[^"]+?)\.d\.ts"/g, '$1.js"')
        .replace(/(import\s+"\.[^"]+?)\.d\.ts"/g, '$1.js"')
        // inline type imports: import("../store/types.d.ts").ViewerOptions
        .replace(/(import\("\.[^"]+?)\.d\.ts"\)/g, '$1.js")');
      if (out !== src) writeFileSync(p, out);
    }
  }
}
walk(new URL("../dist-lib/types", import.meta.url).pathname);
