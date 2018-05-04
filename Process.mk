JS_SRC   = $(MAIN:=.js) $(JS_LIBS:=.js)
LESS_SRC = features.less $(MAIN:=.less) $(LESS_LIBS:=.less)
HTM_SRC  = features.htm $(MAIN:=.htm) $(HTM_LIBS:=.htm)
ALL_SRC  = $(JS_SRC) $(LESS_SRC) $(HTM_SRC)

JS_OUT   = $(MAIN:=.jsc)
LESS_OUT = features.css $(MAIN:=.css)
HTM_OUT  = features.html $(MAIN:=.html)
ALL_OUT  = $(JS_OUT) $(LESS_OUT) $(HTM_OUT)

.PHONY: all watch clean
all: features.css features.html $(MAIN:=.jsc) $(MAIN:=.css) $(MAIN:=.html)

$(MAIN:=.jsc): %: $(JS_LIBS:=.js)
features.css $(MAIN:=.css): %: $(LESS_LIBS:=.less)
features.html $(MAIN:=.html): %: $(HTM_LIBS:=.htm)

watch:
	$(MAKE) -s all
	./watch.sh $(addprefix -f ,$(ALL_SRC)) -- $(MAKE) -s all

clean:
	rm -f $(ALL_OUT)

%.jsc: %.js
	cpp -P -C -traditional-cpp -nostdinc $< $@

%.css: %.less
	node --no-deprecation $(shell which lessc) $< > $@

%.html: %.htm
	cpp -P -C -traditional-cpp -nostdinc $< $@
