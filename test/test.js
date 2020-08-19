/* eslint-env mocha */
// const assert = require("assert");
const fs = require("fs").promises;

const rollup = require("rollup");
const {withDir} = require("tempdir-yaml");
const {looksLike} = require("string-looks-like");
// const {default: endent} = require("endent");

const createPlugin = require("..");

async function bundle({input, dir, targets}) {
  const bundle = await rollup.rollup({
    input,
    plugins: [
      createPlugin(targets)
    ]
  });
  await bundle.write({
    output: {
      dir,
      format: "es"
    }
  });
}

describe("main", () => {
  it("inject to html", () =>
    withDir(`
      - dist:
        - js:
        - index.html: |
            <html></html>
        - options.html: |
            <html></html>
      - src:
        - index.js: |
            import foo from "./foo.js";
            export default "index" + foo;
        - options.js: |
            import foo from "./foo.js";
            export default "options" + foo;
        - foo.js: |
            export default "FOO";
    `, async resolve => {
      await bundle({
        input: [
          resolve("src/index.js"),
          resolve("src/options.js")
        ],
        dir: resolve("dist/js"),
        targets: [
          {
            test: /(index|options)\.js$/,
            target: resolve("dist/$1.html"),
            handle: (content, {htmlScripts}) => content.replace("</", `${htmlScripts}</`)
          }
        ]
      });
      
      looksLike(
        await fs.readFile(resolve("dist/index.html"), "utf8"),
        String.raw`<html><script src="js/foo-{{\w+}}.js"></script><script src="js/index.js"></script></html>`
      );
      
      looksLike(
        await fs.readFile(resolve("dist/options.html"), "utf8"),
        String.raw`<html><script src="js/foo-{{\w+}}.js"></script><script src="js/options.js"></script></html>`
      );
    })
  );
  
  it("relative path with parent folder", () =>
    withDir(`
      - dist:
        - js:
        - html:
          - index.html: |
              <html></html>
          - options.html: |
              <html></html>
      - src:
        - index.js: |
            import foo from "./foo.js";
            export default "index" + foo;
        - options.js: |
            import foo from "./foo.js";
            export default "options" + foo;
        - foo.js: |
            export default "FOO";
    `, async resolve => {
      await bundle({
        input: [
          resolve("src/index.js"),
          resolve("src/options.js")
        ],
        dir: resolve("dist/js"),
        targets: [
          {
            test: /(index|options)\.js$/,
            target: resolve("dist/html/$1.html"),
            handle: (content, {htmlScripts}) => content.replace("</", `${htmlScripts}</`)
          }
        ]
      });
      
      looksLike(
        await fs.readFile(resolve("dist/html/index.html"), "utf8"),
        String.raw`<html><script src="../js/foo-{{\w+}}.js"></script><script src="../js/index.js"></script></html>`
      );
      
      looksLike(
        await fs.readFile(resolve("dist/html/options.html"), "utf8"),
        String.raw`<html><script src="../js/foo-{{\w+}}.js"></script><script src="../js/options.js"></script></html>`
      );
    })
  );
  
  it("inject to json", () =>
    withDir(`
      - dist:
        - js:
        - manifest.json: |
            {
              "files": []
            }
      - src:
        - index.js: |
            import foo from "./foo.js";
            export default "index" + foo;
        - options.js: |
            import foo from "./foo.js";
            export default "options" + foo;
        - foo.js: |
            export default "FOO";
    `, async resolve => {
      await bundle({
        input: [
          resolve("src/index.js"),
          resolve("src/options.js")
        ],
        dir: resolve("dist/js"),
        targets: [
          {
            test: /index\.js$/,
            target: resolve("dist/manifest.json"),
            handle: (content, {scripts}) => {
              content.files = scripts;
              return content;
            }
          }
        ]
      });
      
      looksLike(
        await fs.readFile(resolve("dist/manifest.json"), "utf8"),
        String.raw`
        {
          "files": [
            "js/foo-{{\w+}}.js",
            "js/index.js"
          ]
        }
        `
      );
    })
  );
});
