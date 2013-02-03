UGLIFYJS = uglifyjs

.PHONY:	all clean

all:    classify.js
	$(UGLIFYJS) --unsafe -nc -o classify.min.js classify.js
	cp classify.min.js doc/classify.min.js
	gzip --best --stdout classify.min.js > classify.min.gz.js

clean:
	rm -rf classify.min.js

test:
	./node_modules/nodeunit/bin/nodeunit ./tests/unit