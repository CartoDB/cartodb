
UGLIFYJS = ./node_modules/.bin/uglifyjs

CSS_FILES = $(wildcard themes/css/infowindow/*.css themes/css/map/*.css themes/css/tooltip/*.css)
CSS_FILES_IE = $(wildcard themes/css/ie/*.css)

TORQUE_FILES = vendor/mod/carto.js vendor/mod/torque.uncompressed.js src/geo/gmaps/torque.js src/geo/leaflet/torque.js src/geo/ui/time_slider.js      vendor/mod/jquery-ui/jquery.ui.core.js vendor/mod/jquery-ui/jquery.ui.widget.js vendor/mod/jquery-ui/jquery.ui.mouse.js vendor/mod/jquery-ui/jquery.ui.slider.js     scripts/mod.torque.footer.js
#dist:  dist/cartodb.js dist/cartodb.full.js themes
dist:  dist/cartodb.js dist/cartodb.css dist/cartodb.ie.css dist/cartodb.nojquery.js dist/cartodb.core.js dist/cartodb.mod.torque.js dist/cartodb.noleaflet.js


dist_folder:
	mkdir -p dist

dist/cartodb.uncompressed.js: dist_folder
	node scripts/compress.js
	mv dist/_cartodb.js dist/cartodb.uncompressed.js

dist/cartodb.full.uncompressed.js: dist_folder
	node scripts/compress.js


dist/cartodb.js: dist/cartodb.uncompressed.js
	$(UGLIFYJS) dist/cartodb.uncompressed.js > dist/cartodb.js

dist/cartodb.core.js:  vendor/mustache.js vendor/underscore-min.js vendor/mustache.js vendor/reqwest.min.js src/cartodb.js src/api/core_lib.js src/core/profiler.js src/api/sql.js src/api/tiles.js src/geo/layer_definition.js
	node scripts/get.js header > dist/cartodb.core.uncompressed.js
	cat scripts/core_header.js >> dist/cartodb.core.uncompressed.js
	cat vendor/underscore-min.js  >> dist/cartodb.core.uncompressed.js
	echo "\nvar _ = this._; _.noConflict();" >> dist/cartodb.core.uncompressed.js
	cat vendor/mustache.js vendor/reqwest.min.js src/cartodb.js src/api/core_lib.js src/core/profiler.js src/api/sql.js src/geo/layer_definition.js src/api/tiles.js >> dist/cartodb.core.uncompressed.js
	cat scripts/core_footer.js >> dist/cartodb.core.uncompressed.js
	$(UGLIFYJS) dist/cartodb.core.uncompressed.js > dist/cartodb.core.js

dist/cartodb.mod.torque.uncompressed.js: dist_folder $(TORQUE_FILES)
	cat $(TORQUE_FILES) > dist/cartodb.mod.torque.uncompressed.js

dist/cartodb.mod.torque.js: dist/cartodb.mod.torque.uncompressed.js
	$(UGLIFYJS) dist/cartodb.mod.torque.uncompressed.js > dist/cartodb.mod.torque.js


dist/cartodb.nojquery.js: dist/cartodb.uncompressed.js
	$(UGLIFYJS) dist/_cartodb_nojquery.js > dist/cartodb.nojquery.js
	rm dist/_cartodb_nojquery.js

dist/cartodb.noleaflet.js: dist/_cartodb_noleaflet.js
	$(UGLIFYJS) dist/_cartodb_noleaflet.js > dist/cartodb.noleaflet.js
	rm dist/_cartodb_noleaflet.js

dist/cartodb.css: css
	cp themes/css/cartodb.css dist

dist/cartodb.ie.css: css
	cp themes/css/cartodb.ie.css dist

clean: 
	rm -rf dist/*

css: $(CSS_FILES) $(CSS_FILES_IE)
	rm -rf themes/css/cartodb.css themes/css/cartodb.ie.css
	cat $(CSS_FILES) > themes/css/cartodb.css
	cat $(CSS_FILES_IE) > themes/css/cartodb.ie.css

release: dist css
	node scripts/release.js

publish: release
	#./scripts/publish.sh
	node scripts/publish.js

publish_npm: release
	npm publish

invalidate: 
	#./scripts/publish.sh
	node scripts/publish.js --invalidate

publish_develop: release
	#./scripts/publish.sh
	node scripts/publish.js --current_version

cartodb: dist/cartodb.full.uncompressed.js dist/cartodb.mod.torque.uncompressed.js



PHONY: clean themes dist

