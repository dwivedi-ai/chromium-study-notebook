// Run from this repository: node scripts/audit_book.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { lessons } from '../assets/js/data.js';
import { deepSections } from '../assets/js/deep.js';
import { advancedSections } from '../assets/js/advanced.js';
import { workshops } from '../assets/js/workshops.js';
import { blinkComplete } from '../assets/js/blink-complete.js';
import { depsComplete } from '../assets/js/deps-complete.js';
import { ciComplete } from '../assets/js/ci-complete.js';
import { graphComplete } from '../assets/js/graph-complete.js';
import { outline, additions } from '../assets/js/outline.js';
import { coverage } from '../assets/js/coverage.js';
import { glossary } from '../assets/js/glossary.js';
import { connections } from '../assets/js/connections.js';
import { outcomes, reviewProblems } from '../assets/js/study-guide.js';
import { figures, withFigures } from '../assets/js/figures.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const ids = lessons.map(lesson => lesson.id);
if (new Set(ids).size !== ids.length) errors.push('Duplicate chapter ID');
let sectionCount = 0;
for (const [index, lesson] of lessons.entries()) {
  const all = [
    ...lesson.sections,
    ...(deepSections[lesson.id] || []),
    ...(advancedSections[lesson.id] || []),
    ...(workshops[lesson.id] || []),
    ...(blinkComplete[lesson.id] || []),
    ...(depsComplete[lesson.id] || []),
    ...(ciComplete[lesson.id] || []),
    ...(graphComplete[lesson.id] || []),
  ];
  sectionCount += all.length;
  const titles = all.map(section => section[0]);
  for (const figure of figures[lesson.id] || []) {
    if (titles.filter(title => title === figure.after).length !== 1) errors.push(`${lesson.id}: figure anchor missing or ambiguous: ${figure.after}`);
    for (const path of figure.sources) if (!lesson.files.some(file => file.path === path)) errors.push(`${lesson.id}: figure source is not in chapter references: ${path}`);
    for (const key of ['title', 'lead', 'diagram', 'explanation', 'question', 'answer']) if (!figure[key]) errors.push(`${lesson.id}: figure missing ${key}`);
  }
  const illustrated = withFigures(lesson, all);
  if (illustrated.length !== all.length || illustrated.some(([title, body], i) => title !== all[i][0] || !body.startsWith(all[i][1]))) errors.push(`${lesson.id}: figures changed or removed original content`);
  const slugs = titles.map(title => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  if (new Set(slugs).size !== slugs.length) errors.push(`${lesson.id}: colliding section links`);
  if (!outcomes[lesson.id]?.length) errors.push(`${lesson.id}: missing learning objectives`);
  if (new Set(titles).size !== titles.length) errors.push(`${lesson.id}: duplicate section title`);
  const before = new Map((additions[lesson.id] || []).map(([anchor, ...extra]) => [anchor, extra]));
  const readingOrder = outline[lesson.id]?.flatMap(title => [...(before.get(title) || []), title]) || titles;
  if (readingOrder.length !== titles.length || readingOrder.some(title => !titles.includes(title))) {
    errors.push(`${lesson.id}: section omitted or invented in reading order`);
  }
  for (const dependency of lesson.deps) {
    if (ids.indexOf(dependency) < 0 || ids.indexOf(dependency) >= index) errors.push(`${lesson.id}: invalid prerequisite ${dependency}`);
  }
  for (const file of lesson.files) {
    if (!file.local) continue;
    const repo = file.repo === 'depot' ? 'depot_tools' : file.repo;
    if (!existsSync(join(root, 'source-tree', repo, file.path))) errors.push(`${lesson.id}: missing local source ${repo}/${file.path}`);
  }
}

const mapped = coverage.flatMap(group => group.sections);
if (mapped.length !== 64 || mapped.filter(row => !row.bibliography).length !== 59) errors.push('Original writing section count changed');
for (const row of mapped) if (!row.bibliography && (!row.lessons.length || row.lessons.some(id => !ids.includes(id)))) errors.push(`Unmapped writing section: ${row.title}`);
for (const [term, , id] of glossary) if (!ids.includes(id)) errors.push(`Glossary link missing for ${term}`);
for (const [a, b] of connections) if (!ids.includes(a) || !ids.includes(b)) errors.push(`Invalid chapter connection: ${a}, ${b}`);
for (const id of Object.keys(reviewProblems)) if (!ids.includes(id)) errors.push(`Worked problem has no chapter: ${id}`);
for (const id of Object.keys(figures)) if (!ids.includes(id)) errors.push(`Figure has no chapter: ${id}`);
const evidence = JSON.parse(readFileSync(join(root, 'data', 'evidence.json'), 'utf8'));
if (evidence.facts.length !== 3705 || evidence.openQuestions.length !== 74) errors.push('Research evidence count changed');
const app = readFileSync(join(root, 'assets', 'js', 'app.js'), 'utf8');
if (/Detailed reading|Deeper reading|chromium-writings\/.*index\.html|href=.*library\//i.test(app)) errors.push('Original essay route or deeper-reading control returned');

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`${lessons.length} chapters, ${sectionCount} visible sections, ${Object.values(figures).flat().length} contextual figures, ${mapped.length} mapped writing sections, ${evidence.facts.length} preserved research claims: audit passed`);
}
