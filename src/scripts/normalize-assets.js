const fs = require("fs");
const { join, resolve } = require('path');

const args = parseArgs();
const ROOT_PATH = resolve(`${__dirname}/../../`);
const NORMALIZE_PATH = join(ROOT_PATH, args.path);
const SAVE_CHANGES = !!args.save;
const IMPORT_MAP = new Map();
let changes = 0;

function parseArgs() {
  return process.argv.reduce((out, arg) => {
    const matches = arg.match(/--(\w+)=?(.*)/);

    if (matches) {
      out[matches[1]] = matches[2] || true;
    }
    return out;
  }, {});
}

function readDir(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      err && reject(err);
      resolve(files);
    });
  });
}

function isDirectory(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      err && reject(err);
      resolve(stats.isDirectory());
    });
  });
}

async function loadPath(path) {
  const files = await readDir(path);
  const sorted = files.sort((a, b) =>
    a.localeCompare(b)
  );

  for (let i = 0; i < sorted.length; i++) {
    const filePath = join(path, sorted[i]);
    const isDir = await isDirectory(filePath);

    isDir
      ? await loadPath(filePath)
      : await loadFile(filePath);
  }
}

async function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      err && reject(err);
      resolve(data);
    });
  });
}

async function writeFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, 'utf-8', (err) => {
      err && reject(err);
      resolve(true);
    });
  });
}

async function loadFile(filePath) {
  const editor = Editor(filePath);

  if (editor.ext === 'html') {
    const errChanges = await fixTemplateError(editor);
    const srcChanges = await fixTemplateSrc(editor);

    if (errChanges || srcChanges) {
      console.log('ADD', filePath.replace('.html', '.ts'));
      IMPORT_MAP.set(filePath.replace('.html', '.ts'));
    }
  }
  else if (editor.ext === 'ts'
    && editor.prefix === 'component'
  ) {
      const srcChanges = await fixComponentSrc(editor);

      if (srcChanges || IMPORT_MAP.has(filePath)) {
        await addSspaImport(editor, 'SspaService', 'src/app/services/sspa.service');
        await addSspaService(editor, 'public sspaService: SspaService');
      }
  }
  else if (editor.ext === 'ts'
    && editor.prefix === 'service'
    && editor.filename !== 'sspa.service.ts'
  ) {
    const srcChanges = await fixServiceSrc(editor);

    if (srcChanges) {
      await addSspaImport(editor, 'SspaService', 'src/app/services/sspa.service');
      await addSspaService(editor, 'public sspaService: SspaService');
    }
  }
  else if (editor.ext === 'ts'
    && editor.prefix === 'constants'
  ) {
    await fixConstantSrc(editor);
  }
  await editor.save();
}

function addSspaImport(editor, service, servicePath) {
  const path = editor.toRelPath(servicePath);
  return editor.prepend(`import { ${service} } from '${path}';`);
}

function addSspaService(editor, service) {
  let instanceCount = 0;

  return editor.replace(
    /([ /]*constructor\s?\([^]*?\)\s*\{)/g,
    (value) => {
      if (/^\s*\/{2}/.test(value)) return;
      if (value.indexOf(service) !== -1) return;
      if (instanceCount++) return;

      const construct = value.replace(/[\n\r]/gm, '');
      const [_, spacing, name, body] = construct.match(/^(\s*)(.*?)\((.*?)\)\s*\{/);
      const params = body
        .replace(/\/\//, ',\n//')
        .split(',');

      params.push(service);

      return spacing + name + '(\n' +
        params
          .filter(param => /\S+/.test(param))
          .map(param => `${spacing}  ${param.trim()}`)
          .join(',\n') +
        `\n${spacing}) {`;
    }
  );
}

function fixTemplateSrc(editor) {
  return editor.replace(
    /([[(]?\w*\.?src[\])]?)\s?=\s?(["'])(.*?)\2/gim,
    (src, quote, body) => {
      if (/assets/.test(body)) {
        // wrap src tag in parens if it's not already wrapped
        // if (src === 'src') {
        //   src = `[${src}]`;
        // }
        // one quoted/unquoted string
        if (!/'/.test(body) || /^'[^']*?'$/.test(body)) {
          body = toAsset(body);
        }
        // multiple strings
        else {
          body = body.split(/\s+/)
            .map(part => /assets/.test(part)
              ? toAsset(part)
              : part
            )
            .join(' ');
        }
        return `[src]="sspaService.toAsset(${body})"`;
      }
    }
  );
}

function fixTemplateError(editor) {
  return editor.replace(
    /onerror="\s*\(\s*this.src\s*=\s*'(.*?)'\s*\)\s*;*"/gim,
    (src) => {
      if (/assets/.test(src)) {
        return `(error)="sspaService.imgError($event,${toAsset(src)})"`;
      }
    }
  );
}

function fixComponentSrc(editor) {
  return editor.replace(
    /(['"`])(.*?\/?assets\/.*?)\1/gim,
    (_, string) => {
      string = string.replace('${window.location.origin}', '');
      return `this.sspaService.toAsset(${toAsset(string)})`;
    }
  );
}

function fixServiceSrc(editor) {
  return editor.replace(
    /(['"`])(.*?\/?assets\/.*?)\1/gim,
    (_, string) => {
      string = string.replace('${window.location.origin}', '');
      return `this.sspaService.toAsset(${toAsset(string)})`;
    }
  )
}

function fixConstantSrc(editor) {
  return editor.replace(
    /(['"`])(.*?\/?assets\/.*?)\1/gim,
    (_, string) => {
      string = string.replace('${window.location.origin}', '');
      return `sspaService.toAsset(${toAsset(string)})`;
    }
  );
}

function toAsset(path) {
  const out = path
    .replace(/["']/gm, '')
    .replace(/.*?assets\//, '');

  return `'${out}'`;
}

function Editor(filePath) {
  const parts = filePath.split('.').reverse();
  const prefix = parts.length > 2 ? parts[1] : '';
  const filePaths = filePath.replace(ROOT_PATH, '').split('/').slice(1);
  const filename = filePaths[filePaths.length - 1];
  const ext = parts[0];
  const matches = [];
  let data;

  async function load() {
    if (!data) {
      data = await readFile(filePath);
    }
  }

  async function replace(regex, cb) {
    let changes = 0;

    await load();

    data = data.replace(regex, function(from, a, b, c) {
      const to = cb(a, b, c);

      if (to) {
        matches.push({ from, to });
        changes++;
        return to;
      }
      return from;
    });

    return changes;
  }

  async function prepend(text) {
    let changes = 0;

    await load();

    if (data.indexOf(text) === -1) {
      data = text + '\n' + data;
      matches.push({ from: '', to: text });
      changes++;
    }

    return changes;
  }

  async function save() {
    if (matches.length) {
      if (SAVE_CHANGES) {
        await writeFile(filePath, data);
      }

      console.log(`\n============ ${filePath} ============\n`);
      matches.forEach(match => {
        changes++;
        if (match.from) {
          console.log('-', match.from);
        }
        if (match.to) {
          console.log('+', match.to);
        }
        console.log();
      });
    }
  }

  function toRelPath(relPath) {
    const relPaths = relPath.split('/');
    let start = 0;
    let outPath = [];

    while (relPaths[start] === filePaths[start]) {
      start++;
    }
    for (i = start; i < filePaths.length - 1; i++) {
      outPath.push('..');
    }
    outPath = outPath.concat(relPaths.slice(start));

    const output = outPath.join('/');

    return (/^\./.test(output))
      ? output
      : `./${output}`;
  }

  return { replace, prepend, save, toRelPath, ext, prefix, filename };
}

// -------------------------------------------------------
//          Main Begin-End
// -------------------------------------------------------

loadPath(NORMALIZE_PATH).then(
  () => {
    console.log(`TOTAL CHANGES: ${changes}`);
  },
  err => console.log(err)
);
