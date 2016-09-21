all:
	npm install

clean:
	@rm -rf node_modules/

test:
	grunt test
