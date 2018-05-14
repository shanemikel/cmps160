VENDOR_DIR  = vendor
ifdef USE_CDN
USE_CDN    := -DUSE_CDN
VENDOR_DIR  =
endif

JS_SRC	  = $(MAIN:=.js) $(JS_LIBS:=.js)
LESS_SRC  = $(MAIN:=.less) $(LESS_LIBS:=.less)
HTM_SRC	  = $(MAIN:=.htm) $(HTM_LIBS:=.htm)
ALL_SRC   = $(JS_SRC) $(LESS_SRC) $(HTM_SRC)

JS_OUT	  = $(MAIN:=.jsc)
LESS_OUT  = $(MAIN:=.css)
HTM_OUT	  = $(MAIN:=.html)
ALL_OUT	  = $(JS_OUT) $(LESS_OUT) $(HTM_OUT)

DIST      = $(PROJECT).tar.gz

.PHONY: all watch clean dist count

all: $(MAIN:=.jsc) $(MAIN:=.css) $(MAIN:=.html)

$(MAIN:=.jsc): %: $(JS_LIBS:=.js)
features.css $(MAIN:=.css): %: $(LESS_LIBS:=.less)
features.html $(MAIN:=.html): %: $(HTM_LIBS:=.htm)

watch:
	$(MAKE) -s all
	./watch.sh $(addprefix -f ,$(ALL_SRC)) -- $(MAKE) -s all

clean:
	rm -f $(ALL_OUT) $(DIST)

dist: $(DIST)

$(DIST): $(ALL_OUT) lib
	tar --xform "s/^/$(PROJECT)\//" -czhf $@ $^ $(VENDOR_DIR)

count:
	wc $(ALL_SRC)

%.jsc: %.js
	cpp -P -C -traditional-cpp -nostdinc $< $@

%.css: %.less
	node --no-deprecation $(shell which lessc) $< > $@

%.html: %.htm
	cpp $(USE_CDN) -P -C -traditional-cpp -nostdinc $< $@
