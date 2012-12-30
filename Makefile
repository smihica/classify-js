UGLIFYJS = ./node_modules/uglify-js/bin/uglifyjs

.PHONY:	all clean

all:    classify.js
	$(UGLIFYJS) classify.js > classify.min.js

clean:
	rm -rf classify.min.js

test:
	./node_modules/nodeunit/bin/nodeunit ./test