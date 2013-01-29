UGLIFYJS = uglifyjs

.PHONY:	all clean

all:    classify.js
	$(UGLIFYJS) --unsafe -nc -o classify.min.js classify.js

clean:
	rm -rf classify.min.js

test:
	./node_modules/nodeunit/bin/nodeunit ./tests/unit