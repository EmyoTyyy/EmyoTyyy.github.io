/*
 * The table the query section runs against. One row per project, and the
 * numbers are real: deps is how many packages the thing actually installs,
 * which is why so much of this column is a zero.
 *
 * Links live beside the data rather than in it, so that SELECT * shows the
 * columns a person would want to read and nothing that is really plumbing.
 */
window.PROJECTS = {
  table: 'projects',
  columns: ['name', 'kind', 'made_of', 'started', 'deps', 'where_it_lives'],
  links: {
    'Tromp Diagrams': 'https://emyotyyy.github.io/tromp_diagrams/',
    Sheaf: 'https://emyotyyy.github.io/sheaf/',
    'emyot.fun': 'https://emyotyyy.github.io/emyot.fun/',
    Detour: 'https://emyotyyy.github.io/detour/',
    SeQuenceLab: 'https://emyotyyy.github.io/sequencelab-js/',
    Coreloom: 'https://emyotyyy.github.io/emyot.fun/#coreloom',
    'Decay Heat': 'https://emyotyyy.github.io/emyot.fun/#decay-heat',
    'The Drowned Lexicon': 'https://emyotyyy.github.io/emyot.fun/#drowned-lexicon',
    'The Shifting Mansion': 'https://emyotyyy.github.io/emyot.fun/#shifting-mansion'
  },
  rows: [
    {
      name: 'Tromp Diagrams',
      kind: 'site',
      made_of: 'HTML, CSS, JS',
      started: '2026-05',
      deps: 0,
      where_it_lives: 'Lambda calculus, drawn. The one this whole page is built out of.'
    },
    {
      name: 'Sheaf',
      kind: 'app',
      made_of: 'Electron, TypeScript, React',
      started: '2026-08',
      deps: 2,
      where_it_lives: 'A local-first LaTeX editor. Projects stay as ordinary files and compile with the TeX distribution already on your machine.'
    },
    {
      name: 'Loups-Garous',
      kind: 'site',
      made_of: 'HTML, CSS, JS',
      started: '2026-08',
      deps: 0,
      where_it_lives: 'Thirty-nine roles, and the site can run the night itself.'
    },
    {
      name: 'EasyCookAI',
      kind: 'app',
      made_of: 'HTML, CSS, JS',
      started: '2026-08',
      deps: 0,
      where_it_lives: 'A recipe app where the model finds recipes on the real web, imports them, rewrites them on request, and rides along while you cook.'
    },
    {
      name: 'TODO',
      kind: 'app',
      made_of: 'HTML, CSS, JS, Node',
      started: '2026-08',
      deps: 0,
      where_it_lives: 'Yes, I made my own TODO app. A tiny zero-dependency server that persists everything as real files you can read without the app.'
    },
    {
      name: 'emyot.fun',
      kind: 'site',
      made_of: 'JavaScript',
      started: '2026-07',
      deps: 0,
      where_it_lives: 'The games shelf. Only a few games but a lot of hours of gameplay available.'
    },
    {
      name: 'Coreloom',
      kind: 'game',
      made_of: 'JavaScript',
      started: '2026-07',
      deps: 0,
      where_it_lives: 'Wire up chips, write assembly, twenty-three assignments.'
    },
    {
      name: 'Decay Heat',
      kind: 'game',
      made_of: 'JavaScript',
      started: '2026-07',
      deps: 0,
      where_it_lives: 'A reactor night shift, simulated honestly enough to cascade.'
    },
    {
      name: 'The Drowned Lexicon',
      kind: 'game',
      made_of: 'JavaScript',
      started: '2026-07',
      deps: 0,
      where_it_lives: 'Ninety signs, no dictionary, a new language every seed.'
    },
    {
      name: 'The Shifting Mansion',
      kind: 'game',
      made_of: 'JavaScript',
      started: '2026-07',
      deps: 0,
      where_it_lives: 'A house that rearranges itself, five nights running.'
    },
    {
      name: 'Detour',
      kind: 'game',
      made_of: 'JavaScript',
      started: '2026-06',
      deps: 0,
      where_it_lives: 'Quoridor-style tactical game.'
    },
    {
      name: 'SeQuenceLab',
      kind: 'tool',
      made_of: 'JavaScript, SQL',
      started: '2026-06',
      deps: 1,
      where_it_lives: 'Explore a database with real SQL in a browser tab. Local first, then rebuilt so it could be hosted with no server behind it. Made primarily for school.'
    },
    {
      name: 'SkillSwap Hub',
      kind: 'app',
      made_of: 'Python stdlib, SQLite',
      started: '2026-06',
      deps: 0,
      where_it_lives: 'Trade skills, not money. A peer-to-peer learning platform whose entire backend is http.server and sqlite3. No pip install.'
    },
    {
      name: 'The Mansion',
      kind: 'game',
      made_of: 'Unity, C#',
      started: '2026-06',
      deps: 1,
      where_it_lives: 'The original: a mansion with bossfights. Later reborn in a browser as The Shifting Mansion.'
    },
    {
      name: 'Flipy Bloup',
      kind: 'game',
      made_of: 'Unity, C#',
      started: '2025-09',
      deps: 1,
      where_it_lives: 'A flappy bird, from the tutorial. Everyone starts somewhere.'
    },
    {
      name: 'HTML Crafting Table',
      kind: 'site',
      made_of: 'Python, Flask, SQL, Jinja2',
      started: '2025-01',
      deps: 4,
      where_it_lives: 'Where it started. Private repository.'
    }
  ]
}
