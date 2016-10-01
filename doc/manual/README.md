
platform docs
=============

### How to generate

```bash
pip install Sphinx
pip install sphinx_rtd_theme
```

If previous commands trigger `Permission denied` error try with `sudo`.

```bash
make html
```

### How to contribute

Documentation uses Sphinx, an easy way to create structured documentation based on rst. Start with
this [tutorial](http://sphinx-doc.org/tutorial.html)

**Why not markdown?**

markdown is nice but rst has the same features, it's really similar but allow to have cross
references. It also allow to use Sphinx which create TOC, generate different formats (pdf, epub) and
allow to change themes.
