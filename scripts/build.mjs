import { build } from "@ncpa0cpl/nodepack";
import fs from "fs/promises";
import { transform } from "lightningcss";
import { walk } from "node-os-walk";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = (...fpath) => path.resolve(__dirname, "..", ...fpath);

const isDev = process.argv.includes("--dev");
const watch = process.argv.includes("--watch");

async function removeJsxteTypeImports() {
  const ops = [];
  const regx =
    /import(?:\s+type){0,1}\s*\{[^}]+\}\s*from\s*['"]jsxte['"];{0,1}/g;

  for await (const [root, _, files] of walk(p("dist/types"))) {
    for (const f of files) {
      if (f.name.endsWith(".d.ts")) {
        const filepath = path.join(root, f.name);
        ops.push(
          fs.readFile(filepath, "utf-8").then((fileData) => {
            if (regx.test(fileData)) {
              const newData = fileData.replace(regx, "").trimStart();
              return fs.writeFile(filepath, newData);
            }
          }),
        );
      }
    }
  }

  return Promise.all(ops);
}

function onBundleBuildComplete() {
  fs.rename(
    p("dist/bundle/esm/index.mjs"),
    p("dist/bundle/index.js"),
  );
  fs.rm(p("dist/bundle/esm"), {
    recursive: true,
  }).catch(() => {});
}

async function main() {
  /**
   * @type {import("@ncpa0cpl/nodepack").BuildConfig}
   */
  const bldOptions = {
    tsConfig: p("tsconfig.json"),
    srcDir: p("src"),
    outDir: p("dist"),
    target: "ESNext",
    formats: ["esm", "cjs", "legacy"],
    declarations: true,
    watch: watch,
    parsableExtensions: [".css", ".svg"],
    extMapping: {
      ".css": "%FORMAT%",
      ".svg": "%FORMAT%",
    },
    esbuildOptions: {
      sourcemap: isDev ? "inline" : false,
      jsxImportSource: "@ncpa0cpl/vanilla-jsx",
      loader: {
        ".css": "text",
        ".svg": "text",
      },
      plugins: [CssMinifierPlugin()],
    },
    // Dev only:
    // compileVendors: [
    //   "@ncpa0cpl/vanilla-jsx",
    //   "@ncpa0cpl/vanilla-jsx/jsx-runtime",
    //   "lodash.throttle",
    // ],
  };

  /** @type {import("@ncpa0cpl/nodepack").BuildConfig} */
  const bundleOptions = {
    ...bldOptions,
    formats: ["esm"],
    declarations: false,
    entrypoint: p("src/index.js"),
    bundle: true,
    outDir: p("dist/bundle"),
    onBuildComplete: onBundleBuildComplete,
  };

  const buildBase = () => build(bldOptions);
  const buildBundle = () =>
    build(bundleOptions).then(() => onBundleBuildComplete());

  await Promise.all([buildBase(), buildBundle()]);
  await removeJsxteTypeImports();
}

/**
 * @returns {import("esbuild").Plugin}
 */
function CssMinifierPlugin() {
  return {
    name: "css-minifier",
    setup(build) {
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      build.onLoad({ filter: /\.css$/ }, async (args) => {
        try {
          const file = await fs.readFile(args.path, "utf8");
          const minifiedCss = await transform({
            filename: args.path,
            code: encoder.encode(file),
            minify: true,
            sourceMap: isDev,
          });

          let contents = decoder.decode(minifiedCss.code);

          if (minifiedCss.map) {
            // add the source map as inline comment
            contents += `\n/*# sourceMappingURL=data:application/json;base64,${
              Buffer.from(
                minifiedCss.map,
              ).toString("base64")
            } */`;
          }

          return {
            contents,
            loader: "text",
          };
        } catch (err) {
          return {
            errors: [err],
          };
        }
      });
    },
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
