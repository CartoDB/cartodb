
UGLIFYJS = ./node_modules/.bin/uglifyjs

dist: dist/cartodb.js dist/cartodb.min.js

dist/cartodb.js:
	node scripts/compress.js

dist/cartodb.min.js:
	$(UGLIFYJS) dist/cartodb.js > dist/cartodb.min.js

clean: 
	rm -rf dist/cartodb.js


PHONY: clean 

