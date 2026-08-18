/*
 * A small SQL engine, so the index on this page is a query rather than a
 * picture of one. It understands the shape of statement the page actually
 * invites: SELECT, FROM, WHERE, ORDER BY, LIMIT, plus count(*).
 *
 * It is a tokenizer and a recursive descent parser rather than a pile of
 * regular expressions, because WHERE has precedence and parentheses and there
 * is no honest way to fake those. Errors come back worded the way SQLite words
 * them, since SeQuenceLab is SQLite underneath and it would be strange for the
 * page about it to invent its own dialect of complaint.
 */
;(function () {
  'use strict'

  var KEYWORDS = {
    SELECT: 1, FROM: 1, WHERE: 1, ORDER: 1, BY: 1, LIMIT: 1, AND: 1, OR: 1,
    NOT: 1, LIKE: 1, ASC: 1, DESC: 1, IN: 1
  }

  function SqlError(message) {
    this.name = 'SqlError'
    this.message = message
  }
  SqlError.prototype = Object.create(Error.prototype)

  /* ─────────────────────────────────────────────────────── tokenizer ── */

  function tokenize(text) {
    var out = []
    var i = 0
    while (i < text.length) {
      var c = text.charAt(i)

      if (/\s/.test(c)) {
        i += 1
        continue
      }

      // -- to end of line, the SQL comment.
      if (c === '-' && text.charAt(i + 1) === '-') {
        while (i < text.length && text.charAt(i) !== '\n') i += 1
        continue
      }

      if (c === "'" || c === '"') {
        var quote = c
        var value = ''
        i += 1
        while (i < text.length && text.charAt(i) !== quote) {
          value += text.charAt(i)
          i += 1
        }
        if (i >= text.length) throw new SqlError('unterminated string literal')
        i += 1
        out.push({ type: 'string', value: value })
        continue
      }

      if (/[0-9]/.test(c)) {
        var num = ''
        while (i < text.length && /[0-9.]/.test(text.charAt(i))) {
          num += text.charAt(i)
          i += 1
        }
        out.push({ type: 'number', value: parseFloat(num) })
        continue
      }

      if (/[A-Za-z_]/.test(c)) {
        var word = ''
        while (i < text.length && /[A-Za-z0-9_.]/.test(text.charAt(i))) {
          word += text.charAt(i)
          i += 1
        }
        var upper = word.toUpperCase()
        out.push(
          KEYWORDS[upper]
            ? { type: 'keyword', value: upper }
            : { type: 'name', value: word }
        )
        continue
      }

      var two = text.substr(i, 2)
      if (two === '!=' || two === '<>' || two === '<=' || two === '>=') {
        out.push({ type: 'op', value: two === '<>' ? '!=' : two })
        i += 2
        continue
      }

      if ('=<>'.indexOf(c) >= 0) {
        out.push({ type: 'op', value: c })
        i += 1
        continue
      }

      if (',()*;'.indexOf(c) >= 0) {
        out.push({ type: 'punct', value: c })
        i += 1
        continue
      }

      throw new SqlError('unrecognised token: "' + c + '"')
    }
    out.push({ type: 'end', value: '' })
    return out
  }

  /* ────────────────────────────────────────────────────────── parser ── */

  function Parser(tokens, columns) {
    this.tokens = tokens
    this.at = 0
    this.columns = columns
  }

  Parser.prototype.peek = function () {
    return this.tokens[this.at]
  }

  Parser.prototype.next = function () {
    var token = this.tokens[this.at]
    this.at += 1
    return token
  }

  Parser.prototype.accept = function (type, value) {
    var token = this.peek()
    if (token.type !== type) return null
    if (value !== undefined && token.value !== value) return null
    return this.next()
  }

  Parser.prototype.expect = function (type, value) {
    var token = this.accept(type, value)
    if (!token) {
      var found = this.peek()
      throw new SqlError(
        'syntax error near ' + (found.type === 'end' ? 'end of input' : '"' + found.value + '"')
      )
    }
    return token
  }

  Parser.prototype.column = function () {
    var token = this.expect('name')
    if (this.columns.indexOf(token.value) < 0) {
      throw new SqlError('no such column: ' + token.value)
    }
    return token.value
  }

  Parser.prototype.parse = function () {
    this.expect('keyword', 'SELECT')

    var select = []
    if (this.accept('punct', '*')) {
      select = this.columns.slice()
    } else {
      do {
        // count(*) is the one function worth having: it is the query people
        // reach for first when they want to know how much of something there is.
        if (this.peek().type === 'name' && this.peek().value.toLowerCase() === 'count') {
          this.next()
          this.expect('punct', '(')
          this.expect('punct', '*')
          this.expect('punct', ')')
          select.push({ count: true, label: 'count(*)' })
        } else {
          select.push(this.column())
        }
      } while (this.accept('punct', ','))
    }

    this.expect('keyword', 'FROM')
    var table = this.expect('name').value

    var where = null
    if (this.accept('keyword', 'WHERE')) where = this.or()

    var order = []
    if (this.accept('keyword', 'ORDER')) {
      this.expect('keyword', 'BY')
      do {
        var by = this.column()
        var dir = this.accept('keyword', 'DESC') ? -1 : (this.accept('keyword', 'ASC'), 1)
        order.push({ column: by, dir: dir })
      } while (this.accept('punct', ','))
    }

    var limit = null
    if (this.accept('keyword', 'LIMIT')) limit = this.expect('number').value

    this.accept('punct', ';')
    if (this.peek().type !== 'end') {
      throw new SqlError('syntax error near "' + this.peek().value + '"')
    }

    return { select: select, table: table, where: where, order: order, limit: limit }
  }

  // or → and (OR and)*, and → not (AND not)*, so AND binds tighter, as it must.
  Parser.prototype.or = function () {
    var left = this.and()
    while (this.accept('keyword', 'OR')) {
      left = { op: 'or', left: left, right: this.and() }
    }
    return left
  }

  Parser.prototype.and = function () {
    var left = this.negation()
    while (this.accept('keyword', 'AND')) {
      left = { op: 'and', left: left, right: this.negation() }
    }
    return left
  }

  Parser.prototype.negation = function () {
    if (this.accept('keyword', 'NOT')) return { op: 'not', value: this.negation() }
    return this.comparison()
  }

  Parser.prototype.comparison = function () {
    if (this.accept('punct', '(')) {
      var inner = this.or()
      this.expect('punct', ')')
      return inner
    }

    var column = this.column()

    if (this.accept('keyword', 'IN')) {
      this.expect('punct', '(')
      var list = []
      do {
        list.push(this.literal())
      } while (this.accept('punct', ','))
      this.expect('punct', ')')
      return { op: 'in', column: column, list: list }
    }

    var negated = !!this.accept('keyword', 'NOT')
    if (this.accept('keyword', 'LIKE')) {
      return { op: 'like', column: column, value: this.literal(), negated: negated }
    }
    if (negated) throw new SqlError('syntax error near "NOT"')

    var operator = this.expect('op').value
    return { op: operator, column: column, value: this.literal() }
  }

  Parser.prototype.literal = function () {
    var token = this.peek()
    if (token.type === 'string' || token.type === 'number') return this.next().value
    throw new SqlError(
      'syntax error near ' + (token.type === 'end' ? 'end of input' : '"' + token.value + '"')
    )
  }

  /* ────────────────────────────────────────────────────── evaluation ── */

  function like(value, pattern) {
    // % is any run, _ is any single character, and everything else is itself.
    var rx = ''
    for (var i = 0; i < pattern.length; i += 1) {
      var c = pattern.charAt(i)
      if (c === '%') rx += '[\\s\\S]*'
      else if (c === '_') rx += '[\\s\\S]'
      else rx += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    return new RegExp('^' + rx + '$', 'i').test(String(value))
  }

  function compare(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0
    var x = String(a).toLowerCase()
    var y = String(b).toLowerCase()
    return x < y ? -1 : x > y ? 1 : 0
  }

  function test(node, row) {
    switch (node.op) {
      case 'and':
        return test(node.left, row) && test(node.right, row)
      case 'or':
        return test(node.left, row) || test(node.right, row)
      case 'not':
        return !test(node.value, row)
      case 'like':
        return like(row[node.column], node.value) !== node.negated
      case 'in':
        return node.list.some(function (item) {
          return compare(row[node.column], item) === 0
        })
      case '=':
        return compare(row[node.column], node.value) === 0
      case '!=':
        return compare(row[node.column], node.value) !== 0
      case '<':
        return compare(row[node.column], node.value) < 0
      case '<=':
        return compare(row[node.column], node.value) <= 0
      case '>':
        return compare(row[node.column], node.value) > 0
      case '>=':
        return compare(row[node.column], node.value) >= 0
      default:
        throw new SqlError('unsupported comparison')
    }
  }

  function run(text, source) {
    var started = performance.now()
    var plan = new Parser(tokenize(text), source.columns).parse()

    if (plan.table !== source.table) throw new SqlError('no such table: ' + plan.table)

    var rows = source.rows.slice()

    if (plan.where) {
      rows = rows.filter(function (row) {
        return test(plan.where, row)
      })
    }

    if (plan.order.length) {
      // A copy is sorted rather than the source, and the comparison walks the
      // keys in the order they were written, so ORDER BY a, b means what it says.
      rows.sort(function (x, y) {
        for (var i = 0; i < plan.order.length; i += 1) {
          var key = plan.order[i]
          var sign = compare(x[key.column], y[key.column]) * key.dir
          if (sign) return sign
        }
        return 0
      })
    }

    if (plan.limit !== null) rows = rows.slice(0, Math.max(0, plan.limit))

    var counting = plan.select.length === 1 && plan.select[0].count
    if (counting) {
      return {
        columns: ['count(*)'],
        rows: [{ 'count(*)': rows.length }],
        ms: performance.now() - started
      }
    }

    var columns = plan.select.map(function (column) {
      return column.count ? column.label : column
    })

    return {
      columns: columns,
      rows: rows.map(function (row) {
        var out = { __name: row.name }
        columns.forEach(function (column) {
          out[column] = row[column]
        })
        return out
      }),
      ms: performance.now() - started
    }
  }

  window.MiniSQL = { run: run, tokenize: tokenize, SqlError: SqlError }
})()
