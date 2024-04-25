import { build } from "@ncpa0cpl/nodepack";
import fs from "fs/promises";
import { transform } from "lightningcss";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = (...fpath) => path.resolve(__dirname, "..", ...fpath);

const isDev = process.argv.includes("--dev");
const watch = process.argv.includes("--watch");

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
      minify: !isDev,
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

  await build(bldOptions);
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
