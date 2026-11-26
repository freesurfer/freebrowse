import postcss from "postcss";
import type { Plugin } from "vite";

const SKIP_AT_RULES = new Set([
  "keyframes",
  "-webkit-keyframes",
  "-moz-keyframes",
  "font-face",
  "property",
]);

function isInsideSkippedAtRule(node: postcss.Node): boolean {
  let parent = node.parent;
  while (parent && parent.type !== "root") {
    if (
      parent.type === "atrule" &&
      SKIP_AT_RULES.has((parent as postcss.AtRule).name.toLowerCase())
    ) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

/**
 * Scope every CSS selector in `css` under `rootSelector` (default
 * `.freebrowse-root`) and namespace `@keyframes` names so an embedded viewer
 * stylesheet cannot pollute a host page (such as JupyterLab) with global
 * `:root` variables, unscoped `!important` utility classes, or colliding
 * keyframe names.
 */
export function scopeEmbeddedCss(
  css: string,
  rootSelector = ".freebrowse-root",
): string {
  const root = postcss.parse(css);

  // Namespace @keyframes declarations (e.g. `enter` -> `freebrowse-enter`) so
  // they cannot override identically named keyframes in the embedding host.
  const renamedKeyframes = new Map<string, string>();
  root.walkAtRules((atRule) => {
    const name = atRule.name.toLowerCase();
    if (
      name === "keyframes" ||
      name === "-webkit-keyframes" ||
      name === "-moz-keyframes"
    ) {
      const orig = atRule.params.trim();
      if (orig && !orig.startsWith("freebrowse-")) {
        const next = `freebrowse-${orig}`;
        renamedKeyframes.set(orig, next);
        atRule.params = next;
      }
    }
  });

  if (renamedKeyframes.size > 0) {
    const patterns = Array.from(renamedKeyframes.entries()).map(([orig, next]) => {
      const escaped = orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return [new RegExp(`(^|[\\s,])${escaped}(?=$|[\\s,;])`, "g"), `$1${next}`] as const;
    });
    root.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase();
      if (
        prop === "animation" ||
        prop === "animation-name" ||
        prop.startsWith("--animate-")
      ) {
        let val = decl.value;
        for (const [re, replacement] of patterns) {
          val = val.replace(re, replacement);
        }
        decl.value = val;
      }
    });
  }

  root.walkRules((rule) => {
    if (isInsideSkippedAtRule(rule)) return;

    const scoped: string[] = [];
    const seen = new Set<string>();
    const push = (sel: string) => {
      if (!seen.has(sel)) {
        seen.add(sel);
        scoped.push(sel);
      }
    };

    for (const raw of rule.selectors) {
      const sel = raw.trim();
      if (!sel) continue;

      if (sel.includes(rootSelector)) {
        push(sel);
      } else if (
        sel === ":root" ||
        sel === ":host" ||
        sel === "html" ||
        sel === "body"
      ) {
        push(rootSelector);
      } else if (sel === "*") {
        push(rootSelector);
        push(`${rootSelector} *`);
      } else if (sel.startsWith("::") || sel.startsWith(":")) {
        // Pseudo-elements / pseudo-classes (e.g. :before, :after, ::backdrop)
        push(`${rootSelector}${sel}`);
        push(`${rootSelector} ${sel}`);
      } else if (sel.startsWith(".")) {
        // Match utilities placed on `.freebrowse-root` itself as well as descendants
        push(`${rootSelector}${sel}`);
        push(`${rootSelector} ${sel}`);
      } else {
        push(`${rootSelector} ${sel}`);
      }
    }

    if (scoped.length > 0) {
      rule.selectors = scoped;
    }
  });

  return root.toString();
}

/** Vite plugin that scopes every emitted CSS asset under `.freebrowse-root`. */
export function scopeCssPlugin(rootSelector = ".freebrowse-root"): Plugin {
  return {
    name: "freebrowse-scope-css",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type === "asset" && item.fileName.endsWith(".css")) {
          const source =
            typeof item.source === "string"
              ? item.source
              : Buffer.from(item.source).toString("utf8");
          item.source = scopeEmbeddedCss(source, rootSelector);
        }
      }
    },
  };
}
