
UGLIFYJS = ./node_modules/.bin/uglifyjs

CSS_FILES = $(wildcard themes/css/*.css)
CSS_FILES_IE = $(wildcard themes/css/ie/*.css)

#dist:  dist/cartodb.js dist/cartodb.full.js themes
dist:  dist/cartodb.js themes


dist_folder:
	mkdir -p dist

dist/cartodb.uncompressed.js: dist_folder
	node scripts/compress.js
	mv dist/_cartodb.js dist/cartodb.uncompressed.js

dist/cartodb.js: dist/cartodb.uncompressed.js
	$(UGLIFYJS) dist/cartodb.uncompressed.js > dist/cartodb.js

clean: 
	rm -rf dist/*

css: $(CSS_FILES) 
	rm -rf themes/css/cartodb.css themes./css/cartodb.ie.css
	cat $(CSS_FILES) > themes/css/cartodb.css
	cat $(CSS_FILES_IE) > themes/css/cartodb.ie.css

release: dist css
	node scripts/release.js

publish: release
	#./scripts/publish.sh
	node scripts/publish.js


PHONY: clean themes dist

