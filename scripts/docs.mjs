import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(defaultRoot, 'apps/backend/package.json'));
const ts = require('typescript');
const slash = value => value.replaceAll('\\', '/');
const read = file => fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
const hash = text => createHash('sha256').update(text).digest('hex');
const exists = file => fs.existsSync(file);
const table = text => String(text).replaceAll('|', '&#124;').replaceAll('\n', ' ').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const link = (from, to) => slash(path.relative(path.dirname(from), to));
const generatedRoots = ['docs/backend/generated', 'docs/frontend/admin/generated', 'docs/frontend/shop/generated', 'docs/generated'];
const roots = ['apps/backend/src', 'apps/backend/test', 'apps/admin/src', 'apps/shop/src', 'scripts', '.github/workflows'];
const extensions = new Set(['.ts', '.js', '.mjs', '.cjs', '.json', '.html', '.scss', '.css', '.sql', '.yml', '.yaml']);
const configNames = ['package.json', 'angular.json', 'nest-cli.json', 'jest.config.ts', 'tsconfig.json', 'tsconfig.build.json', 'tsconfig.app.json', 'tsconfig.spec.json', '.env.example', '.gitignore'];
const bt = String.fromCharCode(96);
const fence = (code, language = '') => bt.repeat(4) + language + '\n' + code.trimEnd() + '\n' + bt.repeat(4) + '\n';

function walk(directory) {
  if (!exists(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink() || entry.name === 'node_modules' || entry.name === 'dist') return [];
    return entry.isDirectory() ? walk(file) : [file];
  });
}

export function scan(root) {
  const files = roots.flatMap(dir => walk(path.join(root, dir)))
    .filter(file => extensions.has(path.extname(file)) && !path.basename(file).startsWith('.env'));
  for (const app of ['backend', 'admin', 'shop'])
    for (const name of configNames) {
      const file = path.join(root, 'apps', app, name);
      if (exists(file)) files.push(file);
    }
  for (const name of ['package.json', 'docker-compose.yml', 'district-import.sql', 'AGENTS.md', '.gitignore'])
    if (exists(path.join(root, name))) files.push(path.join(root, name));
  return [...new Set(files.map(file => slash(path.relative(root, file))))].sort();
}

function destination(file) {
  const app = file.match(/^apps\/(backend|admin|shop)\//)?.[1];
  const base = app === 'backend' ? generatedRoots[0] : app === 'admin' ? generatedRoots[1] : app === 'shop' ? generatedRoots[2] : generatedRoots[3];
  return base + '/files/' + (app ? file.slice(('apps/' + app + '/').length) : file) + '.md';
}
const decorators = node => ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];

function parseSource(file, content) {
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const declarations = [], entities = [];
  for (const statement of source.statements) {
    if (ts.isClassDeclaration(statement)) {
      const name = statement.name?.text ?? '(anonymous class)';
      declarations.push('### ' + name + '\n\n' + (decorators(statement).map(d => bt + (ts.isCallExpression(d.expression) ? '@' + d.expression.expression.getText(source) + '(...)' : d.getText(source)) + bt).join(' ') || 'Class declaration.') + '\n');
      if (statement.heritageClauses?.length) declarations.push('Inheritance: ' + statement.heritageClauses.map(h => bt + h.getText(source) + bt).join(', ') + '\n');
      const members = statement.members.map(member => {
        const name = member.name?.getText(source) ?? (ts.isConstructorDeclaration(member) ? 'constructor' : '(member)');
        const signature = member.body ? content.slice(member.getStart(source), member.body.getStart(source)).trim() : member.getText(source);
        return '| ' + table(name) + ' | ' + table(signature) + ' |';
      });
      if (members.length) declarations.push('| Member | Declaration, decorators, or initializer |\n| --- | --- |\n' + members.join('\n') + '\n');
      if (decorators(statement).some(d => /^@Entity\b/.test(d.getText(source)))) {
        entities.push('## ' + name + '\n\nSource: ' + bt + file + bt + '. ' + decorators(statement).map(d => bt + table(d.getText(source)) + bt).join(' ') + '\n\n| Property | Mapping declaration |\n| --- | --- |\n' + statement.members.filter(m => ts.isPropertyDeclaration(m)).map(m => '| ' + table(m.name.getText(source)) + ' | ' + table(m.getText(source)) + ' |').join('\n') + '\n');
      }
    } else if (ts.isFunctionDeclaration(statement) || ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) || ts.isEnumDeclaration(statement)) {
      const signature = ts.isFunctionDeclaration(statement) && statement.body ? content.slice(statement.getStart(source), statement.body.getStart(source)).trim() : statement.getText(source);
      declarations.push('### ' + (statement.name?.text ?? 'Declaration') + '\n\n' + fence(signature, 'ts'));
    } else if (ts.isVariableStatement(statement)) {
      declarations.push('### ' + statement.declarationList.declarations.map(d => d.name.getText(source)).join(', ') + '\n\n' + fence(statement.getText(source), 'ts'));
    }
  }
  const imports = source.statements.filter(ts.isImportDeclaration).map(s => '- ' + bt + s.moduleSpecifier.text + bt).join('\n');
  return { text: (imports ? '## Dependencies\n\n' + imports + '\n\n' : '') + (declarations.length ? '## Declarations and members\n\n' + declarations.join('\n') : 'No top-level declarations; inspect the source below.\n'), entities };
}

export function build(root = defaultRoot) {
  const manifest = JSON.parse(read(path.join(root, 'docs/manifest.json')));
  const sources = scan(root), output = new Map(), ownership = new Map(), fingerprints = {};
  const groups = manifest.groups;
  const seen = new Set();
  for (const group of groups) {
    if (seen.has(group.id)) throw new Error('Duplicate guide group: ' + group.id);
    seen.add(group.id);
    if (!group.docs?.length) throw new Error('Guide group has no docs: ' + group.id);
    for (const doc of group.docs) if (!exists(path.join(root, doc))) throw new Error('Missing guide: ' + doc);
  }
  const entitySections = [];
  for (const file of sources) {
    const group = groups.find(g => g.files?.includes(file) || g.prefixes?.some(prefix => file.startsWith(prefix)));
    if (!group) throw new Error('Undocumented source (add manifest owner): ' + file);
    ownership.set(file, group.id);
    const content = read(path.join(root, file)), target = destination(file);
    const parsed = file.endsWith('.ts') ? parseSource(file, content) : { text: '', entities: [] };
    entitySections.push(...parsed.entities);
    const language = file.endsWith('.ts') ? 'ts' : file.endsWith('.json') ? 'json' : file.endsWith('.sql') ? 'sql' : file.endsWith('.html') ? 'html' : file.endsWith('.mjs') ? 'js' : '';
    const code = file === 'district-import.sql' ? content.replace(/(INSERT INTO district_import[\s\S]*?VALUES)[\s\S]*?(;\nSELECT DISTINCT)/, '$1\n-- Dataset omitted here; follow the source link for all district pairs.\n$2') : content;
    output.set(target, '# ' + file + '\n\nGenerated by ' + bt + 'npm run docs:generate' + bt + '. Do not edit this file.\n\n[Source](' + link(target, file) + ') | ' + group.docs.map(doc => '[Guide](' + link(target, doc) + ')').join(' | ') + '\n\nSource SHA-256: ' + bt + hash(content) + bt + '.\n\n' + parsed.text + '\n## Current source\n\n' + fence(code, language));
  }
  for (const base of generatedRoots) {
    const rows = sources.filter(file => destination(file).startsWith(base + '/')).map(file => '- [' + file + '](' + link(base + '/README.md', destination(file)) + ')');
    output.set(base + '/README.md', '# File reference index\n\nGenerated from current repository files. Feature guides explain behavior; these references show exact declarations and source. Files not registered in a runtime module may still appear here.\n\n' + rows.join('\n') + '\n');
  }
  output.set(generatedRoots[0] + '/entities.md', '# Entity mapping reference\n\nGenerated syntactically from @Entity classes. Decorators are shown exactly; this is not live database introspection or a migration. Inferred SQL types, DTO inheritance, and unmanaged geographic tables are explained in [Database structure](../database.md).\n\n' + entitySections.join('\n'));
  for (const group of groups) {
    const sourceData = sources.filter(file => ownership.get(file) === group.id).map(file => [file, hash(read(path.join(root, file)))]);
    const docData = group.docs.map(file => [file, hash(read(path.join(root, file)))]);
    fingerprints[group.id] = hash(JSON.stringify({ group, sourceData, docData }));
  }
  return { output, fingerprints, sources };
}

function reviews(root) {
  const file = path.join(root, 'docs/review-state.json');
  return exists(file) ? JSON.parse(read(file)) : {};
}
export function staleGuides(root, result = build(root)) {
  const state = reviews(root);
  return Object.keys(result.fingerprints).filter(id => state[id] !== result.fingerprints[id]);
}

export function generate(root = defaultRoot) {
  const result = build(root);
  for (const [file, content] of result.output) {
    const absolute = path.join(root, file);
    if (!exists(absolute) || read(absolute) !== content) {
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, content);
    }
  }
  for (const base of generatedRoots) for (const absolute of walk(path.join(root, base))) {
    const relative = slash(path.relative(root, absolute));
    if (!result.output.has(relative) && path.extname(absolute) === '.md') fs.unlinkSync(absolute);
  }
  return result;
}

export function brokenLinks(root) {
  const errors = [];
  for (const absolute of walk(path.join(root, 'docs')).filter(file => file.endsWith('.md'))) {
    // Source snapshots can contain example Markdown; validate only prose.
    let fenceSize = 0;
    const prose = read(absolute).split('\n').filter(line => {
      const size = line.trimStart().match(new RegExp('^' + bt + '{3,}'))?.[0].length ?? 0;
      if (!fenceSize && size) { fenceSize = size; return false; }
      if (fenceSize && size >= fenceSize) { fenceSize = 0; return false; }
      return !fenceSize;
    }).join('\n');
    for (const match of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].replace(/^<|>$/g, '').split('#')[0];
      if (!target || /^[a-z]+:\/\//i.test(target) || target.startsWith('mailto:')) continue;
      if (!exists(path.resolve(path.dirname(absolute), decodeURIComponent(target))))
        errors.push(slash(path.relative(root, absolute)) + ': broken link ' + target);
    }
  }
  return errors;
}

export function check(root = defaultRoot) {
  const result = build(root), errors = [];
  for (const [file, content] of result.output)
    if (!exists(path.join(root, file)) || read(path.join(root, file)) !== content) errors.push('Stale/missing generated reference: ' + file);
  for (const base of generatedRoots) for (const file of walk(path.join(root, base)))
    if (file.endsWith('.md') && !result.output.has(slash(path.relative(root, file)))) errors.push('Obsolete reference: ' + slash(path.relative(root, file)));
  errors.push(...staleGuides(root, result).map(id => 'Guide review required: ' + id), ...brokenLinks(root));
  return errors;
}

export function review(root, ids) {
  const result = build(root), state = reviews(root);
  const selected = ids.includes('--all') ? Object.keys(result.fingerprints) : ids;
  if (!selected.length) throw new Error('Provide reviewed group IDs; use docs:status to list pending groups.');
  for (const id of selected) {
    if (!(id in result.fingerprints)) throw new Error('Unknown guide group: ' + id);
    state[id] = result.fingerprints[id];
  }
  fs.writeFileSync(path.join(root, 'docs/review-state.json'), JSON.stringify(state, null, 2) + '\n');
  return selected;
}

async function main() {
  const [command = 'generate', ...ids] = process.argv.slice(2);
  if (command === 'generate') console.log('Generated references for ' + generate().sources.length + ' files.');
  else if (command === 'check') {
    const errors = check();
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
    else console.log('Documentation is current: references, guide reviews, ownership, and local links passed.');
  } else if (command === 'status') console.log(staleGuides(defaultRoot).join('\n') || 'All guide reviews are current.');
  else if (command === 'review') console.log('Recorded explicit review: ' + review(defaultRoot, ids).join(', '));
  else if (command === 'watch') {
    let previous = '';
    const tick = () => {
      try {
        const current = build(), fingerprint = hash(JSON.stringify([...current.output]));
        if (fingerprint !== previous) { generate(); previous = fingerprint; console.log('References refreshed. Pending guide reviews: ' + (staleGuides(defaultRoot).join(', ') || 'none')); }
      } catch (error) { console.error(error.message); }
    };
    tick();
    setInterval(tick, 1000);
    console.log('Watching source files; Ctrl+C stops. Guide reviews are never acknowledged automatically.');
  } else throw new Error('Unknown docs command: ' + command);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
