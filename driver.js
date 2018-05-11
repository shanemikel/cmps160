#include "shapes.js"
#include "collections.js"
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

let CAMERA_EYE       = new Vector(0, 0, 350);
let CAMERA_CENTER    = ORIGIN;
let CAMERA_UP        = new Vector(0, 1,   0);


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
    gl.enable(gl.DEPTH_TEST);

    INIT_ROTATE_SLIDER(ROTATE_X, 'rotate-x', update(gl))
    INIT_ROTATE_SLIDER(ROTATE_Y, 'rotate-y', update(gl))
    INIT_ROTATE_SLIDER(ROTATE_Z, 'rotate-z', update(gl))

    INIT_TRANSLATE_SLIDER(TRANSLATE_X, 'translate-x', update(gl))
    INIT_TRANSLATE_SLIDER(TRANSLATE_Y, 'translate-y', update(gl))
    INIT_TRANSLATE_SLIDER(TRANSLATE_Z, 'translate-z', update(gl))

    update(gl);
}

function update(gl) {
    let model = new Matrix();
    model     = model.rotateX(Radians.fromDegrees(ROTATE_X));
    model     = model.rotateY(Radians.fromDegrees(ROTATE_Y));
    model     = model.rotateZ(Radians.fromDegrees(ROTATE_Z));
    {
        let vec = new Vector(TRANSLATE_X, TRANSLATE_Y, TRANSLATE_Z);
        model   = model.translate(vec);
    }

    let view = Matrix.lookAt({
        eye:     CAMERA_EYE,
        center:  CAMERA_CENTER,
        up:      CAMERA_UP
    });

    // let projection = Matrix.ortho({
    //     left: -250,
    //     right: 250,
    //     bottom: -250,
    //     top: 250,
    //     near: 1,
    //     far: 1000
    // });

    let projection = Matrix.perspective({
        fovy: Radians.fromDegrees(60),
        aspect: 1,
        near: 1,
        far: 1000
    });


    render(gl, model, view, projection);
}

function render(gl, model, view, projection, mouse_xy) {
    clear(gl, COLOR);
    // render_grid(gl, DARK_GREY);

    let mvp = projection.multiply(view).multiply(model);

    let lights = {
        direct:  new DirectLight(new Vector(0, 0, -1), BLUE),
        ambiant: 0.3
    };

    {
        let m         = projection.multiply(view);
        let left_end  = new Vector(-150, 0, -100);
        let right_end = new Vector( 150, 0, -100);
        let o1        = new Cylinder(left_end, right_end, 50);

        // render_obj(gl, gl.TRIANGLES, o1.toTriangles(4), m, RED);
    }

    {
        let left_end  = new Vector(-150, 0, 0);
        let right_end = new Vector( 150, 0, 0);
        let sides     = 12;
        let o1        = new Cylinder(left_end, right_end, 50);
        let color     = BLUE;

        render_obj_flat(gl, o1.toTriangles(sides), mvp, lights, BLUE);
    }
}

function render_grid(gl, color) {
    let vertices = [];
    vertices.push([-1,  0, 0]);
    vertices.push([ 1,  0, 0]);
    vertices.push([ 0, -1, 0]);
    vertices.push([ 0,  1, 0]);
    render_lines(gl, 2, vertices, color);

    vertices = [];
    let tick_length = 0.5;
    let tick_space  = 0.1;
    for (let i = 1; i <= 2 / tick_space - 1; i++) {
        let tick = i * tick_space - 1;

        vertices.push([-tick_length, tick, 0]);
        vertices.push([ tick_length, tick, 0]);

        vertices.push([tick, -tick_length, 0]);
        vertices.push([tick,  tick_length, 0]);
    }
    render_lines(gl, 1, vertices, color);
}
