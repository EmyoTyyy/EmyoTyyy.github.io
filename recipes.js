/*
 * What the workbench knows how to make. Each pattern is the 3x3 grid read
 * left to right, top to bottom, and the materials are the things the project
 * was actually built out of.
 */
window.CRAFTING_GLYPHS = {
  lam: 'λ',
  tex: 'TeX',
  sql: 'SQL',
  js: 'JS',
  py: 'Py'
}

window.CRAFTING_RECIPES = [
  {
    name: 'Tromp Diagrams',
    note: 'Three bound variables in a row, which is most of lambda calculus.',
    href: 'https://emyotyyy.github.io/tromp_diagrams/',
    pattern: ['', '', '', 'lam', 'lam', 'lam', '', '', '']
  },
  {
    name: 'HTML Crafting Table',
    note: 'Flask on top, SQL underneath, a template holding them together.',
    href: '#workbench',
    pattern: ['py', 'sql', 'js', '', '', '', '', '', '']
  },
  {
    name: 'Sheaf',
    note: 'Two passes of TeX and an editor wrapped around them.',
    href: 'https://emyotyyy.github.io/sheaf/',
    pattern: ['', 'tex', '', '', 'tex', '', '', 'js', '']
  },
  {
    name: 'SeQuenceLab',
    note: 'A database and a browser, on the same diagonal.',
    href: 'https://emyotyyy.github.io/sequencelab-js/',
    pattern: ['sql', '', '', '', 'sql', '', '', '', 'js']
  },
  {
    name: 'emyot.fun',
    note: 'Four corners, four games, no server in the middle.',
    href: 'https://emyotyyy.github.io/emyot.fun/',
    pattern: ['js', '', 'js', '', '', '', 'js', '', 'js']
  },
  {
    name: 'SkillSwap Hub',
    note: 'Python all the way down, with a database in the middle of it.',
    href: '#index',
    pattern: ['', 'py', '', 'py', 'sql', 'py', '', 'py', '']
  }
]
