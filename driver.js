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

let CAMERA           = 1;

let CAMERA_1_EYE     = new Vector(0, 0, 350);
let CAMERA_1_CENTER  = ORIGIN;
let CAMERA_1_UP      = new Vector(0, 1,   0);

let CAMERA_2_EYE     = new Vector(100,    50,  350);
let CAMERA_2_CENTER  = new Vector(-400, -100, -100);
let CAMERA_2_UP      = new Vector(0,       1,    0);

let PROJECTION_NEAR  = null;
let PROJECTION_FAR   = null;

let projection = {
    ORTHOGRAPHIC: 'projection-orthographic',
    PERSPECTIVE:  'projection-perspective'
};
let PROJECTION = projection.PERSPECTIVE;

let shading = {
    FLAT:    'shading-flat',
    GOURAUD: 'shading-gouraud',
    PHONG:   'shading-phong'
};
let SHADING = shading.FLAT;

let shape = {
    CYLINDER: 'shape-cylinder',
    SPHERE:   'shape-sphere'
};
let SHAPE = shape.CYLINDER;


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

    init_range({
        id: 'projection-near',
        value: 1,
        min: 0,
        max: 100,
        step: 1,
        parse: function(value) {
            PROJECTION_NEAR = parseInt(value);
            value           = value.toString();
            switch (value.length) {
            case 1:
                value = '00' + value;
                break;
            case 2:
                value =  '0' + value;
                break;
            }
            return value;
        },
        update: function() {
            update(gl);
        }
    });

    init_range({
        id: 'projection-far',
        value: 500,
        min: 100,
        max: 1000,
        step: 5,
        parse: function(value) {
            PROJECTION_FAR = parseInt(value);
            value          = value.toString();
            switch (value.length) {
            case 1:
                value = '000' + value;
                break;
            case 2:
                value =  '00' + value;
                break;
            case 3:
                value =   '0' + value;
                break;
            }
            return value;
        },
        update: function() {
            update(gl);
        }
    });

    $('#' + PROJECTION).prop('checked', true);
    $('form#projection input[name=projection]').on('change', function(e) {
        let elem   = $(e.target);
        PROJECTION = elem.attr('id');
        update(gl);
    });

    $('#' + SHADING).prop('checked', true);
    $('form#shading-type input[name=shading-type]').on('change', function(e) {
        let elem = $(e.target);
        SHADING  = elem.attr('id');
        update(gl);
    });

    $('#' + SHAPE).prop('checked', true);
    $('form#shape-type input[name=shape-type]').on('change', function(e) {
        let elem = $(e.target);
        SHAPE    = elem.attr('id');
        update(gl);
    });

    $('button#camera-1').click(function(e) {
        e.preventDefault();
        CAMERA = 1;
        update(gl);
    });
    $('button#camera-2').click(function(e) {
        e.preventDefault();
        CAMERA = 2;
        update(gl);
    });

    update(gl);
}

function update(gl, mouse_xy) {
    clear(gl, COLOR);

    let model = new Matrix();
    model     = model.rotateX(Radians.fromDegrees(ROTATE_X));
    model     = model.rotateY(Radians.fromDegrees(ROTATE_Y));
    model     = model.rotateZ(Radians.fromDegrees(ROTATE_Z));
    {
        let vec = new Vector(TRANSLATE_X, TRANSLATE_Y, TRANSLATE_Z);
        model   = model.translate(vec);
    }

    let view;

    switch (CAMERA) {
    case 1:
        view = Matrix.lookAt({
            eye:     CAMERA_1_EYE,
            center:  CAMERA_1_CENTER,
            up:      CAMERA_1_UP
        });
        break;
    case 2:
        view = Matrix.lookAt({
            eye:     CAMERA_2_EYE,
            center:  CAMERA_2_CENTER,
            up:      CAMERA_2_UP
        });
        break;
    }

    let lights     = {};
    lights.ambiant = 0.1;
    lights.direct  = new DirectLight(new Vector(0, 0, -1), BLUE.scale(0.5));
    lights.point   = new PointLight(new Vector(0, 200, 200), BLUE.scale(0.8));

    let proj;

    switch (PROJECTION) {
    case projection.ORTHOGRAPHIC:
        proj = Matrix.ortho({
            left: -250,
            right: 250,
            bottom: -250,
            top: 250,
            near: PROJECTION_NEAR,
            far: PROJECTION_FAR
        });
        break;
    case projection.PERSPECTIVE:
        proj = Matrix.perspective({
            fovy: Radians.fromDegrees(60),
            aspect: 1,
            near: PROJECTION_NEAR,
            far: PROJECTION_FAR
        });
        break;
    }

    let obj;
    switch (SHAPE) {
    case shape.CYLINDER:
        let left_end  = new Vector(-150,  0);
        let right_end = new Vector( 150,  0);
        let sides     = 12;
        let cylinder  = new Cylinder(left_end, right_end, 50);

        obj = cylinder.toTriangles(sides);
        break;
    case shape.SPHERE:
        let sphere = new Sphere(ORIGIN, 100);

        obj = sphere.toTriangles(25, 25);
        break;
    }

    obj.color = BLUE.copy();

    switch (SHADING) {
    case shading.FLAT:
        render_scene(gl, flat_and_gouraud_shaders, normalize_obj_flat,
                     model, view, proj, obj, lights);
        break;
    case shading.GOURAUD:
        render_scene(gl, flat_and_gouraud_shaders, normalize_obj_interpolated,
                     model, view, proj, obj, lights);
        break;
    case shading.PHONG:
        console.log('Phong shading is not yet implemented');
        break;
    }
}
