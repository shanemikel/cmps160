#
#  COPYRIGHT: Shane Pearlman 2018
#

DEFINES     = -DVERBOSE

# VENDOR_DIR  = vendor
# ifdef USE_CDN
DEFINES    += -DUSE_CDN
VENDOR_DIR  =
# endif

ifdef DEBUG
DEFINES    += -DDEBUG
endif

JS_SRC	  = $(MAIN:=.jsc) $(JS_LIBS:=.jsc)
LESS_SRC  = $(MAIN:=.less) $(LESS_LIBS:=.less)
HTM_SRC	  = $(MAIN:=.htm) $(HTM_LIBS:=.htm)
ALL_SRC   = $(JS_SRC) $(LESS_SRC) $(HTM_SRC)

JS_OUT	  = $(MAIN:=.js)
LESS_OUT  = $(MAIN:=.css)
HTM_OUT	  = $(MAIN:=.html)
ALL_OUT	  = $(JS_OUT) $(LESS_OUT) $(HTM_OUT)
ALL_MIN   = $(foreach file,$(ALL_OUT),$(call min_file,$(file)))

min_file  = $(basename $(1)).min$(suffix $(1))

DIST      = $(PROJECT).tar.gz
FEATURES  = $(wildcard features.html)

.PHONY: all watch clean dist count

ifdef DEBUG
all: $(ALL_OUT)
else
all: $(ALL_MIN)
endif

$(MAIN:=.js): %: $(JS_LIBS:=.jsc)
$(MAIN:=.css): %: $(LESS_LIBS:=.less)
$(MAIN:=.html): %: $(HTM_LIBS:=.htm)

watch:
	$(MAKE) -s all
	./watch.sh $(addprefix -f ,$(ALL_SRC)) -- $(MAKE) -s all

clean:
	rm -f $(ALL_OUT) $(ALL_MIN) $(DIST)

dist: $(DIST)

ifdef DEBUG
$(DIST): $(ALL_OUT) lib $(FEATURES)
else
$(DIST): $(ALL_MIN) lib $(FEATURES)
endif
	tar --xform "s/^/$(PROJECT)\//" -czhf $@ $^ $(VENDOR_DIR)

count:
	wc $(ALL_SRC)

%.js: %.jsc
	cpp $(DEFINES) -P -C -traditional-cpp -nostdinc $< $@

%.min.js: %.js
	minify $< > $@

%.css: %.less
	node --no-deprecation $(shell which lessc) $< > $@

%.min.css: %.css
	minify $< > $@

%.html: %.htm
	cpp $(DEFINES) -P -C -traditional-cpp -nostdinc $< $@

%.min.html: %.html
	minify --html-keep-default-attrvals $< > $@
