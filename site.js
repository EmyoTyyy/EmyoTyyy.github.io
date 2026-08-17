/*
 * The moving parts: the reduction on the hero, the crafting grid, the reveals.
 *
 * The reduction is interpolated per frame rather than handed to CSS, because
 * Chromium will not transition x1/y1/x2/y2 on an SVG <line>. Every segment
 * carries a stable id across steps, so a bar that survives a reduction slides
 * to its new place, a bar the redex creates fades in, and one it consumes fades
 * out. That is what makes it read as a movement instead of a slideshow, and it
 * is the same approach js/ui/render.js takes on tromp_diagrams.
 */
;(function () {
  'use strict'

  var SVG_NS = 'http://www.w3.org/2000/svg'
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
  }

  /* ───────────────────────────────────────────────── the reduction ── */

  var data = window.LAMBDA_REDUCTION
  var svg = document.getElementById('reduction')
  var termEl = document.getElementById('term')
  var stepsEl = document.getElementById('steps')
  var playEl = document.getElementById('play')

  if (data && svg && termEl && stepsEl && playEl) {
    var SLIDE = calm ? 0 : 820
    var HOLD = 1250
    var END_HOLD = 2600

    var lines = {} // segid -> { el, x1, y1, x2, y2, opacity }
    var index = 0
    var playing = !calm
    var timer = null
    var frame = null
    var onScreen = true

    svg.setAttribute('viewBox', '0 0 ' + data.w + ' ' + data.h)
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', data.steps[0].sw)

    var PLAY_PATH = 'M4.5 3 13 8l-8.5 5z'
    var PAUSE_PATH = 'M5 3.5h2v9H5z M9 3.5h2v9H9z'

    function setIcon() {
      playEl.querySelector('path').setAttribute('d', playing ? PAUSE_PATH : PLAY_PATH)
      playEl.setAttribute('aria-label', playing ? 'Pause the reduction' : 'Play the reduction')
    }

    function put(rec) {
      rec.el.setAttribute('x1', rec.x1)
      rec.el.setAttribute('y1', rec.y1)
      rec.el.setAttribute('x2', rec.x2)
      rec.el.setAttribute('y2', rec.y2)
      rec.el.style.opacity = rec.opacity
    }

    function newLine(seg, opacity) {
      var el = document.createElementNS(SVG_NS, 'line')
      el.setAttribute('stroke-linecap', seg.c)
      svg.appendChild(el)
      var rec = { el: el, x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, opacity: opacity }
      put(rec)
      return rec
    }

    // One rAF loop drives every segment at once: each carries where it started
    // and where it is going, and the loop walks them all there together.
    function run(plan, duration, done) {
      if (frame) cancelAnimationFrame(frame)
      if (duration <= 0) {
        plan.forEach(function (p) {
          apply(p, 1)
        })
        cleanup(plan)
        if (done) done()
        return
      }
      var start = performance.now()
      function tick(now) {
        var t = Math.min(1, (now - start) / duration)
        var k = easeOutCubic(t)
        for (var i = 0; i < plan.length; i += 1) apply(plan[i], k)
        if (t < 1) {
          frame = requestAnimationFrame(tick)
        } else {
          frame = null
          cleanup(plan)
          if (done) done()
        }
      }
      frame = requestAnimationFrame(tick)
    }

    function apply(p, k) {
      var rec = p.rec
      rec.x1 = p.from.x1 + (p.to.x1 - p.from.x1) * k
      rec.y1 = p.from.y1 + (p.to.y1 - p.from.y1) * k
      rec.x2 = p.from.x2 + (p.to.x2 - p.from.x2) * k
      rec.y2 = p.from.y2 + (p.to.y2 - p.from.y2) * k
      rec.opacity = p.from.opacity + (p.to.opacity - p.from.opacity) * k
      put(rec)
    }

    function cleanup(plan) {
      plan.forEach(function (p) {
        if (!p.drop) return
        if (p.rec.el.parentNode) p.rec.el.parentNode.removeChild(p.rec.el)
        delete lines[p.id]
      })
    }

    function show(i, duration) {
      index = i
      var step = data.steps[i]
      var plan = []
      var seen = {}

      termEl.textContent = step.term
      svg.setAttribute('stroke-width', step.sw)
      for (var m = 0; m < markers.length; m += 1) {
        markers[m].setAttribute('aria-current', m === i ? 'true' : 'false')
      }

      step.segs.forEach(function (seg) {
        seen[seg.id] = true
        var rec = lines[seg.id]
        if (!rec) {
          // Born in this step: appear where it will live, and fade up.
          rec = newLine(seg, 0)
          lines[seg.id] = rec
          plan.push({
            id: seg.id,
            rec: rec,
            from: { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, opacity: 0 },
            to: { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, opacity: 1 }
          })
          return
        }
        rec.el.setAttribute('stroke-linecap', seg.c)
        plan.push({
          id: seg.id,
          rec: rec,
          from: { x1: rec.x1, y1: rec.y1, x2: rec.x2, y2: rec.y2, opacity: rec.opacity },
          to: { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, opacity: 1 }
        })
      })

      Object.keys(lines).forEach(function (id) {
        if (seen[id]) return
        var rec = lines[id]
        plan.push({
          id: id,
          rec: rec,
          drop: true,
          from: { x1: rec.x1, y1: rec.y1, x2: rec.x2, y2: rec.y2, opacity: rec.opacity },
          to: { x1: rec.x1, y1: rec.y1, x2: rec.x2, y2: rec.y2, opacity: 0 }
        })
      })

      run(plan, duration === undefined ? SLIDE : duration)
    }

    function reset(then) {
      var plan = []
      Object.keys(lines).forEach(function (id) {
        var rec = lines[id]
        plan.push({
          id: id,
          rec: rec,
          drop: true,
          from: { x1: rec.x1, y1: rec.y1, x2: rec.x2, y2: rec.y2, opacity: rec.opacity },
          to: { x1: rec.x1, y1: rec.y1, x2: rec.x2, y2: rec.y2, opacity: 0 }
        })
      })
      run(plan, calm ? 0 : 340, then)
    }

    var markers = []
    data.steps.forEach(function (step, i) {
      var li = document.createElement('li')
      var button = document.createElement('button')
      button.type = 'button'
      button.setAttribute('aria-label', 'Step ' + i + ' of ' + (data.steps.length - 1))
      button.addEventListener('click', function () {
        playing = false
        window.clearTimeout(timer)
        setIcon()
        show(i)
      })
      li.appendChild(button)
      stepsEl.appendChild(li)
      markers.push(li)
    })

    function advance() {
      if (index >= data.steps.length - 1) {
        reset(function () {
          if (playing) {
            show(0, 0)
            queue()
          }
        })
        return
      }
      show(index + 1)
      queue()
    }

    function queue() {
      window.clearTimeout(timer)
      if (!playing || !onScreen) return
      var wait = index >= data.steps.length - 1 ? END_HOLD : SLIDE + HOLD
      timer = window.setTimeout(advance, wait)
    }

    playEl.addEventListener('click', function () {
      playing = !playing
      setIcon()
      if (playing) queue()
      else window.clearTimeout(timer)
    })

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        function (entries) {
          onScreen = entries[0].isIntersecting
          if (onScreen) queue()
          else window.clearTimeout(timer)
        },
        { threshold: 0.1 }
      ).observe(svg)
    }

    setIcon()
    show(0, 0)
    queue()
  }

  /* ──────────────────────────────────────────────── the workbench ── */

  var bench = document.getElementById('bench')
  if (bench) {
    var RECIPES = window.CRAFTING_RECIPES || []
    var cells = [].slice.call(bench.querySelectorAll('.bench__cell'))
    var palette = [].slice.call(document.querySelectorAll('.bench__item'))
    var outEl = document.getElementById('bench-out')
    var held = null
    var grid = ['', '', '', '', '', '', '', '', '']

    function paint() {
      cells.forEach(function (cell, i) {
        cell.dataset.item = grid[i]
        cell.textContent = grid[i] ? window.CRAFTING_GLYPHS[grid[i]] : ''
        cell.setAttribute('aria-label', grid[i] ? grid[i] : 'empty slot')
      })
    }

    function match() {
      var key = grid.join(',')
      for (var i = 0; i < RECIPES.length; i += 1) {
        if (RECIPES[i].pattern.join(',') === key) return RECIPES[i]
      }
      return null
    }

    function output() {
      var hit = match()
      outEl.innerHTML = ''
      outEl.classList.toggle('bench__out--full', !!hit)
      if (!hit) {
        outEl.setAttribute('aria-label', 'Nothing yet')
        return
      }
      var a = document.createElement('a')
      a.href = hit.href
      a.rel = 'noopener'
      a.className = 'bench__result'
      a.innerHTML = '<strong>' + hit.name + '</strong><span>' + hit.note + '</span>'
      outEl.appendChild(a)
      outEl.setAttribute('aria-label', 'Crafted ' + hit.name)
    }

    function pick(name) {
      held = name
      palette.forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.item === name ? 'true' : 'false')
      })
    }

    palette.forEach(function (b) {
      b.addEventListener('click', function () {
        pick(b.dataset.item)
      })
    })

    cells.forEach(function (cell, i) {
      cell.addEventListener('click', function () {
        grid[i] = grid[i] === held || !held ? '' : held
        paint()
        output()
      })
    })

    var clearEl = document.getElementById('bench-clear')
    if (clearEl) {
      clearEl.addEventListener('click', function () {
        grid = ['', '', '', '', '', '', '', '', '']
        paint()
        output()
      })
    }

    var hintEl = document.getElementById('bench-hint')
    if (hintEl) {
      hintEl.addEventListener('click', function () {
        var r = RECIPES[Math.floor(Math.random() * RECIPES.length)]
        grid = r.pattern.slice()
        paint()
        output()
      })
    }

    if (palette.length) pick(palette[0].dataset.item)
    paint()
    output()
  }

  /* ──────────────────────────────────────────────────────── reveals ── */

  if (!calm && 'IntersectionObserver' in window) {
    var reveal = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-in')
          reveal.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -6%' }
    )
    document.querySelectorAll('[data-reveal]').forEach(function (node) {
      reveal.observe(node)
    })
  } else {
    document.documentElement.classList.remove('js-reveal')
  }

  /* ───────────────────────────────────────────── header on scroll ── */

  var nav = document.getElementById('nav')
  if (nav && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div')
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;'
    document.body.appendChild(sentinel)
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('nav--stuck', !entries[0].isIntersecting)
    }).observe(sentinel)
  }
})()
