# EmyoTyyy.github.io

The landing page served at <https://emyotyyy.github.io>.

A user site: GitHub reserves the repository name `<username>.github.io` for the
root of the domain, so this page sits at `/` while every project keeps its own
path (`/sheaf`, `/tromp_diagrams`, and so on).

## The diagrams

Every Tromp diagram on the page, the six in the vocabulary strip and each frame
of the hero reduction, is laid out by `js/core/ast.js`, `js/core/reduce.js` and
`js/ui/layout.js` taken straight from the
[tromp_diagrams](https://github.com/EmyoTyyy/tromp_diagrams) repository. Nothing
here reimplements the layout, so a diagram on this page and the same term on
that site are drawn by the same code.

The hero shows `(\m n f x. m f (n f x)) 2 3` reducing under normal order to
Church 5, in six steps.

To regenerate `reduction.js` after changing the term, run the generator against
a checkout of `tromp_diagrams`; each step carries stable segment ids so that a
line surviving a reduction slides to its new place instead of being redrawn.

## Local preview

No server needed, but one behaves better with fonts:

```bash
python3 -m http.server 8000
```
