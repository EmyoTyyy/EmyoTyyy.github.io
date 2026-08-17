/*
 * Two small things: the reduction on the hero, and the reveals.
 *
 * The reduction data in reduction.js is a list of steps, each a set of line
 * segments keyed by a stable id. A segment that survives a step slides to its
 * new position, one that appears fades in, one that is consumed by the redex
 * fades out. That is the same idea the visualiser on tromp_diagrams uses, and
 * it is the reason a reduction reads as a movement rather than a slideshow.
 */
;(function () {
  'use strict'

  var SVG_NS = 'http://www.w3.org/2000/svg'
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ───────────────────────────────────────────────── the reduction ── */

  var data = window.LAMBDA_REDUCTION
  var svg = document.getElementById('reduction')
  var termEl = document.getElementById('term')
  var stepsEl = document.getElementById('steps')
  var playEl = document.getElementById('play')

  if (data && svg && termEl && stepsEl && playEl) {
    var SLIDE = calm ? 0 : 780
    var HOLD = 1500
    var END_HOLD = 3200

    var lines = {} // segid -> <line>
    var index = 0
    var playing = !calm
    var timer = null

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

    // One tick per step, so the progress bar doubles as a scrubber.
    var markers = []
    data.steps.forEach(function (step, i) {
      var li = document.createElement('li')
      var button = document.createElement('button')
      button.type = 'button'
      button.setAttribute('aria-label', 'Step ' + i + ' of ' + (data.steps.length - 1))
      button.addEventListener('click', function () {
        stop()
        show(i)
      })
      li.appendChild(button)
      stepsEl.appendChild(li)
      markers.push(li)
    })

    function mark(i) {
      for (var k = 0; k < markers.length; k += 1) {
        markers[k].setAttribute('aria-current', k === i ? 'true' : 'false')
      }
    }

    function makeLine(seg) {
      var line = document.createElementNS(SVG_NS, 'line')
      line.setAttribute('x1', seg.x1)
      line.setAttribute('y1', seg.y1)
      line.setAttribute('x2', seg.x2)
      line.setAttribute('y2', seg.y2)
      line.setAttribute('stroke-linecap', seg.c)
      line.style.opacity = '0'
      svg.appendChild(line)
      // Next frame, so the transition has two values to move between.
      requestAnimationFrame(function () {
        line.style.transition = 'opacity ' + SLIDE + 'ms ease'
        line.style.opacity = '1'
      })
      return line
    }

    function show(i) {
      index = i
      var step = data.steps[i]
      var seen = {}

      termEl.textContent = step.term
      mark(i)
      svg.setAttribute('stroke-width', step.sw)

      for (var s = 0; s < step.segs.length; s += 1) {
        var seg = step.segs[s]
        seen[seg.id] = true
        var line = lines[seg.id]
        if (!line) {
          lines[seg.id] = makeLine(seg)
          continue
        }
        line.style.transition = calm
          ? 'none'
          : 'x1 ' + SLIDE + 'ms cubic-bezier(0.22,1,0.36,1),' +
            'y1 ' + SLIDE + 'ms cubic-bezier(0.22,1,0.36,1),' +
            'x2 ' + SLIDE + 'ms cubic-bezier(0.22,1,0.36,1),' +
            'y2 ' + SLIDE + 'ms cubic-bezier(0.22,1,0.36,1),' +
            'opacity ' + SLIDE + 'ms ease'
        line.setAttribute('x1', seg.x1)
        line.setAttribute('y1', seg.y1)
        line.setAttribute('x2', seg.x2)
        line.setAttribute('y2', seg.y2)
        line.setAttribute('stroke-linecap', seg.c)
        line.style.opacity = '1'
      }

      // Whatever the redex ate.
      Object.keys(lines).forEach(function (id) {
        if (seen[id]) return
        var gone = lines[id]
        delete lines[id]
        gone.style.transition = 'opacity ' + SLIDE / 2 + 'ms ease'
        gone.style.opacity = '0'
        window.setTimeout(function () {
          if (gone.parentNode) gone.parentNode.removeChild(gone)
        }, SLIDE)
      })
    }

    function advance() {
      var last = data.steps.length - 1
      var next = index >= last ? 0 : index + 1
      if (next === 0) {
        // Back to the start: clear out rather than sliding everything home.
        Object.keys(lines).forEach(function (id) {
          var gone = lines[id]
          delete lines[id]
          gone.style.transition = 'opacity 320ms ease'
          gone.style.opacity = '0'
          window.setTimeout(function () {
            if (gone.parentNode) gone.parentNode.removeChild(gone)
          }, 340)
        })
        window.setTimeout(function () {
          if (playing) show(0)
        }, 360)
      } else {
        show(next)
      }
      queue()
    }

    function queue() {
      window.clearTimeout(timer)
      if (!playing) return
      var wait = index >= data.steps.length - 1 ? END_HOLD : SLIDE + HOLD
      timer = window.setTimeout(advance, wait)
    }

    function stop() {
      playing = false
      window.clearTimeout(timer)
      setIcon()
    }

    playEl.addEventListener('click', function () {
      playing = !playing
      setIcon()
      if (playing) queue()
      else window.clearTimeout(timer)
    })

    // Nothing moves while the hero is off screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) {
            if (playing) queue()
          } else {
            window.clearTimeout(timer)
          }
        },
        { threshold: 0.15 }
      ).observe(svg)
    }

    setIcon()
    show(0)
    queue()
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
