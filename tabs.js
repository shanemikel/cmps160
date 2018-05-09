#include "shapes.js"
#include "util.js"


let WHITE            = null;
let BLACK            = null;
let RED              = null;
let GREEN            = null;
let BLUE             = null;
let GREY             = null;
let DARK_GREY        = null;
let LIGHT_GREY       = null;

let CANVAS           = null;
let WIDTH            = null;
let HEIGHT           = null;
let COLOR            = null;

let ROTATE_X         = null;
let ROTATE_Y         = null;
let ROTATE_Z         = null;
let TRANSLATE_X      = null;
let TRANSLATE_Y      = null;
let TRANSLATE_Z      = null;


function init() {
    LOAD_CSS_COLOR(WHITE      , '--white')
    LOAD_CSS_COLOR(BLACK      , '--black')
    LOAD_CSS_COLOR(RED        , '--red')
    LOAD_CSS_COLOR(GREEN      , '--green')
    LOAD_CSS_COLOR(BLUE       , '--blue')
    LOAD_CSS_COLOR(GREY       , '--grey')
    LOAD_CSS_COLOR(DARK_GREY  , '--dark-grey')
    LOAD_CSS_COLOR(LIGHT_GREY , '--light-grey')

    WIDTH  = $('#g-webgl').css('width');
    HEIGHT = $('#g-webgl').css('height');
    COLOR  = RGBColor.fromHex($('#g-webgl').css('--background-color'));

    CANVAS = $('#webgl');
    CANVAS.attr('width'  , WIDTH);
    CANVAS.attr('height' , HEIGHT);

    $('span.spacer').each(function(i, elem) {
        let e = $(elem);
        e.css('width', e.attr('data-size') || e.css('--size'));
    });

    $('.tab-labels').each(function(i, elem) {
        let e   = $(elem);
        let def = e.attr('data-default');
        set_current_tab(elem, def);

        e.children('label').each(function(i, elem) {
            let label_for = $(elem).attr('for');
            $(elem).click(() => set_current_tab(e, label_for));
        });
    });

}

function set_current_tab(tabs_elem, label_for) {
    $(tabs_elem).children('label').each(function(i, elem) {
        let e = $(elem);
        if (e.attr('for') !== label_for)
            e.removeClass('current');
        else
            e.addClass('current');
    });
    $(tabs_elem).nextAll('.tab').each(function(i, elem) {
        let e = $(elem);
        if (e.attr('id') !== label_for)
            e.prop('hidden', true);
        else
            e.prop('hidden', false);
    });
}


function main() {
    init();

    let gl = getWebGLContext(CANVAS[0]);
    if (! gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    start(gl);
}

function start(gl) {
    INIT_ROTATE_SLIDER(ROTATE_X, 'rotate-x', update(gl))
    INIT_ROTATE_SLIDER(ROTATE_Y, 'rotate-y', update(gl))
    INIT_ROTATE_SLIDER(ROTATE_Z, 'rotate-z', update(gl))

    INIT_TRANSLATE_SLIDER(TRANSLATE_X, 'translate-x', update(gl))
    INIT_TRANSLATE_SLIDER(TRANSLATE_Y, 'translate-y', update(gl))
    INIT_TRANSLATE_SLIDER(TRANSLATE_Z, 'translate-z', update(gl))

    update(gl);
}

function update(gl) {
    let xform = new Matrix();
    xform     = xform.rotateX(Radians.fromDegrees(ROTATE_X));
    xform     = xform.rotateY(Radians.fromDegrees(ROTATE_Y));
    xform     = xform.rotateZ(Radians.fromDegrees(ROTATE_Z));
    // xform     = xform.translate(new Vector(TRANSLATE_X, TRANSLATE_Y, TRANSLATE_Z));

    render(gl, xform);
}

function render(gl, xform, mouse_xy) {
    clear(gl, COLOR);

    render_grid(gl, DARK_GREY);

    let left_end  = new Vector(-0.5, 0.0, 0.0);
    let right_end = new Vector( 0.5, 0.0, 0.0);
    let o1        = (new Cylinder(left_end, right_end, 0.2)).toTrigs(12);
    render_obj(gl, gl.TRIANGLES, o1, xform);
}

function render_grid(gl, color) {
    let vertices = [];
    vertices.push([-1.0,  0.0, 0.0]);
    vertices.push([ 1.0,  0.0, 0.0]);
    vertices.push([ 0.0, -1.0, 0.0]);
    vertices.push([ 0.0,  1.0, 0.0]);
    render_lines(gl, 2, vertices, color);

    vertices = [];
    let tick_length = 0.5;
    let tick_space  = 0.1;
    for (let i = 1; i <= 2 / tick_space - 1; i++) {
        let tick = i * tick_space - 1;

        vertices.push([-tick_length, tick, 0.0]);
        vertices.push([ tick_length, tick, 0.0]);

        vertices.push([tick, -tick_length, 0.0]);
        vertices.push([tick,  tick_length, 0.0]);
    }
    render_lines(gl, 1, vertices, color);
}
