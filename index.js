const path = require("path");
const fs = require("fs").promises;

const {name} = require("./package.json");

function applyMatchRef(s, arr) {
  return s.replace(/\$(\d+)/g, (m, n) => arr[Number(n)] || m);
}

function createImportResolver(bundle) {
  return key => search(key, new Set);
  
  function* search(key, colored) {
    if (colored.has(key)) {
      return;
    }
    colored.add(key);
    for (const subKey of bundle[key].imports) {
      yield* search(subKey, colored);
    }
    yield key;
  }
}

function createPlugin(targets) {
  return {
    name,
    writeBundle
  };

  async function writeBundle(options, bundle) {
    const importResolver = createImportResolver(bundle);
    for (const key in bundle) {
      let match, target;
      for (target of targets) {
        match = key.match(target.test);
        if (match) {
          break;
        }
      }
      if (!match) continue;
      
      const prefix = options.dir;
      const absTarget = path.resolve(applyMatchRef(target.target, match));
      
      const scripts = [...importResolver(key)]
        .map(p => path.resolve(prefix, p))
        .map(p => path.relative(path.dirname(absTarget), p))
        .map(p => p.replace(/\\/g, "/"));
        
      const context = {
        scripts,
        htmlScripts: scripts.map(p => `<script src="${p}"></script>`).join("")
      };
        
      let content = await fs.readFile(absTarget, "utf8");
      if (absTarget.endsWith(".json")) {
        content = JSON.parse(content);
      }
      let output = await target.handle(content, context);
      if (typeof output !== "string") {
        output = JSON.stringify(output, null, 2);
      }
      await fs.writeFile(absTarget, output);
    }
  }
}

module.exports = createPlugin;
