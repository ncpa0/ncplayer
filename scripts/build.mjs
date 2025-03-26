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
      },
      plugins: [CssMinifierPlugin(), SvgLoaderPlugin()],
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
  const buildStandaloneCss = () =>
    buildCss({
      src: p("src/player.styles.css"),
      outFile: p("dist/styles.css"),
      sourceMap: isDev,
    });

  await Promise.all([buildBase(), buildBundle(), buildStandaloneCss()]);
  await removeJsxteTypeImports();
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
/**
 * @param {{ src: string; sourceMap?: boolean; outFile?: string }} options
 */
async function buildCss(options) {
  const file = await fs.readFile(options.src, "utf8");
  const minifiedCss = await transform({
    filename: options.src,
    code: encoder.encode(file),
    minify: true,
    sourceMap: options.sourceMap,
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

  if (options.outFile) {
    // make sure the output directory exists
    const outDir = path.dirname(options.outFile);
    await fs.mkdir(outDir, { recursive: true });

    await fs.writeFile(options.outFile, contents);
  }

  return contents;
}

/**
 * @returns {import("esbuild").Plugin}
 */
function CssMinifierPlugin() {
  return {
    name: "css-minifier",
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        try {
          let contents = await buildCss({
            src: args.path,
            sourceMap: isDev,
          });

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

/**
 * @returns {import("esbuild").Plugin}
 */
function SvgLoaderPlugin() {
  return {
    name: "svg-loader",
    setup(build) {
      build.onResolve({ filter: /\.svg$/ }, (args) => {
        return {
          path: path.resolve(args.resolveDir, args.path),
          namespace: "svg-ns",
        };
      });

      build.onLoad({ filter: /.+/, namespace: "svg-ns" }, async (args) => {
        const file = await fs.readFile(args.path, "utf-8");

        const contents = /* js */ `
          const svgstr = ${JSON.stringify(file)};
          const parser = new DOMParser();
          export default function() {
            const elem = parser.parseFromString(svgstr, "image/svg+xml").firstChild;
            return elem;
          }
        `;

        return {
          contents,
          loader: "js",
        };
      });
    },
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
