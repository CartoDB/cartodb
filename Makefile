
UGLIFYJS = ./node_modules/.bin/uglifyjs

CSS_FILES = $(wildcard themes/css/*.css)

dist:  dist/cartodb.js dist/cartodb.full.js themes

dist/cartodb.full.uncompressed.js:
	node scripts/compress.js include_deps
	mv dist/_cartodb.js dist/cartodb.full.uncompressed.js

dist/cartodb.uncompressed.js:
	node scripts/compress.js
	mv dist/_cartodb.js dist/cartodb.uncompressed.js

dist/cartodb.full.js: dist/cartodb.full.uncompressed.js 
	$(UGLIFYJS) dist/cartodb.full.uncompressed.js > dist/cartodb.full.js

dist/cartodb.js: dist/cartodb.uncompressed.js
	$(UGLIFYJS) dist/cartodb.uncompressed.js > dist/cartodb.js

clean: 
	rm -rf dist/*

css: $(CSS_FILES) 
	cat $(CSS_FILES) > themes/css/all.css

release: dist css
	node scripts/release.js


PHONY: clean themes dist

