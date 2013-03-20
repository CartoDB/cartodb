
UGLIFYJS = ./node_modules/.bin/uglifyjs

CSS_FILES = $(wildcard themes/css/infowindow/*.css themes/css/map/*.css)
CSS_FILES_IE = $(wildcard themes/css/ie/*.css)

#dist:  dist/cartodb.js dist/cartodb.full.js themes
dist:  dist/cartodb.js  dist/cartodb.css dist/cartodb.ie.css dist/cartodb.nojquery.js


dist_folder:
	mkdir -p dist

dist/cartodb.uncompressed.js: dist_folder
	node scripts/compress.js
	mv dist/_cartodb.js dist/cartodb.uncompressed.js

dist/cartodb.js: dist/cartodb.uncompressed.js
	$(UGLIFYJS) dist/cartodb.uncompressed.js > dist/cartodb.js

dist/cartodb.nojquery.js: dist/cartodb.uncompressed.js
	$(UGLIFYJS) dist/_cartodb_nojquery.js > dist/cartodb.nojquery.js
	rm dist/_cartodb_nojquery.js

dist/cartodb.css: css
	cp themes/css/cartodb.css dist

dist/cartodb.ie.css: css
	cp themes/css/cartodb.ie.css dist

clean: 
	rm -rf dist/*

css: $(CSS_FILES) 
	rm -rf themes/css/cartodb.css themes/css/cartodb.ie.css
	cat $(CSS_FILES) > themes/css/cartodb.css
	cat $(CSS_FILES_IE) > themes/css/cartodb.ie.css

release: dist css
	node scripts/release.js

publish: release
	#./scripts/publish.sh
	node scripts/publish.js

invalidate: 
	#./scripts/publish.sh
	node scripts/publish.js --invalidate

publish_develop: release
	#./scripts/publish.sh
	node scripts/publish.js --current_version


PHONY: clean themes dist

