
UGLIFYJS = ./node_modules/.bin/uglifyjs

CSS_FILES = $(wildcard themes/css/*.css)

#dist:  dist/cartodb.js dist/cartodb.full.js themes
dist:  dist/cartodb.js themes


dist_folder:
	mkdir dist

dist/cartodb.uncompressed.js: dist_folder
	node scripts/compress.js
	mv dist/_cartodb.js dist/cartodb.uncompressed.js

dist/cartodb.js: dist/cartodb.uncompressed.js
	$(UGLIFYJS) dist/cartodb.uncompressed.js > dist/cartodb.js

clean: 
	rm -rf dist/*

css: $(CSS_FILES) 
	rm -rf themes/css/cartodb.css
	cat $(CSS_FILES) > themes/css/cartodb.css

release: dist css
	node scripts/release.js

publish: 
	./scripts/publish.sh


PHONY: clean themes dist

