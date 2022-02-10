rollup-plugin-write-output
==============================

![.github/workflows/build.yml](https://github.com/eight04/rollup-plugin-write-output/workflows/.github/workflows/build.yml/badge.svg)
[![codecov](https://codecov.io/gh/eight04/rollup-plugin-write-output/branch/master/graph/badge.svg)](https://codecov.io/gh/eight04/rollup-plugin-write-output)
[![install size](https://packagephobia.now.sh/badge?p=rollup-plugin-write-output)](https://packagephobia.now.sh/result?p=rollup-plugin-write-output)

Inject output chunks to HTML or JSON files. This plugin is often used with [iife](https://www.npmjs.com/package/rollup-plugin-iife) or environments without a module loader.

Installation
------------

```
npm install -D rollup-plugin-write-output
```

Usage
-----

```js
import iife from "rollup-plugin-iife";
import output from "rollup-plugin-write-output";

export default {
  input: ["foo.js", "bar.js"],
  output: {
    dir: "dist/js",
    format: "es"
  },
  plugins: [
    iife(),
    output([
      {
        test: /foo\.js/,
        target: "dist/foo.html",
        handle: (content, {htmlScripts}) =>
          content.replace("</body>", `${htmlScripts}</body>`)
      },
      {
        test: /bar\.js/
        target: "dist/manifest.json",
        handle: (content, {scripts}) => {
          content.files = scripts;
          return content;
        }
      }
    ])
  ]
};
```

API
----

This module exports a single function.

### createPlugin

```js
const plugin = createPlugin([
  {
    test: RegExp,
    target: String,
    handle: async (
      content: String | JSON,
      context: {
        scripts: Array<String>,
        htmlScripts: String
      }
    ) => newContent: String | JSON
  },
  ...
]);
```

This function accepts a list of targets.

`test` is a regular expression matching the output filename.

`target` is the path to the file that you want to modify. You can use `$1`, `$2`, `$3`, etc, to reference the capture group matched by `test`.

`handle` is a function that injects scripts into `target`.

* `content` - the original content of `target`. If `target` is a JSON file, `content` will be parsed into an JSON object.
* `context.scripts` - list of path to output chunks, including the output file and its dependencies. The list is ordered so dependencies load first. Paths are relative to `target` and always use forward slash `/`.
* `context.htmlScripts` - HTML script tags that can be injected to HTML directly. It equals to ``scripts.map(s => `<script src="${s}"></script>`).join("")``.

Scripts are ordered and dependencies will be loaded first.

Changelog
---------

* 0.1.2 (Feb 10, 2022)

  - Fix: handle generated assets.

* 0.1.1 (Feb 12, 2021)

  - Add: an import resolver to guaratee script execution order.

* 0.1.0 (Aug 19, 2020)

  - Initial release.
