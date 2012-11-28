
api.html: API.md
	markdown2 --extras fenced-code-blocks API.md > _api.html
	python -c "from string import Template;open('api.html', 'w').write( Template(open('doc_template.html').read()).substitute(content=open('_api.html').read()))"
	

all: api.html

clean: 
	rm -rf api.html

.PHONY: clean
