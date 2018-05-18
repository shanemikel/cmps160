#include "shapes.js"
#include "collections.js"
#include "util.js"

let WHITE          = null;
let BLACK          = null;
let RED            = null;
let GREEN          = null;
let BLUE           = null;
let GREY           = null;
let DARK_GREY      = null;
let LIGHT_GREY     = null;

let CANVAS         = null;
let WIDTH          = null;
let HEIGHT         = null;
let COLOR          = null;

let ROTATE_X       = 180;
let ROTATE_Y       = 0;
let ROTATE_Z       = 0;

let TRANSLATE_X    = 0;
let TRANSLATE_Y    = 0;
let TRANSLATE_Z    = 0;

let CAMERA_EYE     = new Vector(0, 0, 350);
let CAMERA_CENTER  = ORIGIN;
let CAMERA_UP      = new Vector(0, 1,   0);

let AMBIANT_COLOR  = TRUE_WHITE.scale(0.15);

let DIRECT_X       = 0;
let DIRECT_Y       = -100;
let DIRECT_Z       = -100;
let DIRECT_COLOR   = TRUE_WHITE.scale(0.8);

let POINT_X        = 250;
let POINT_Y        = 150;
let POINT_Z        = -125;
let POINT_COLOR    = TRUE_WHITE.scale(0.8);

let SPECULAR_POWER = 8;

let light = {
    AMBIANT:  'light-ambiant',
    DIRECT:   'light-direct',
    POINT:    'light-point',
    SPECULAR: 'light-specular'
};
let LIGHT = {
    ambiant:  true,
    direct:   false,
    point:    true,
    specular: true
};

let projection = {
    ORTHOGRAPHIC: 'projection-orthographic',
    PERSPECTIVE:  'projection-perspective'
};
let PROJECTION = projection.PERSPECTIVE;

let shading = {
    FLAT:    'shading-flat',
    GOURAUD: 'shading-gouraud',
    PHONG:   'shading-phong',
    NORMAL:  'shading-normal',
    DEPTH:   'shading-depth',
    EDGE:    'shading-edge'
};
let SHADING = shading.PHONG;

let shape = {
    CYLINDER: 'shape-cylinder',
    SPHERE:   'shape-sphere'
};
let SHAPE = shape.SPHERE;


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
            $(elem).click(function(ev) {
                if ($(ev.target).attr('data-disabled') !== 'disabled')
                    set_current_tab(e, label_for)
            });
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

    init_angle_slider(GETTER_SETTER(ROTATE_X), 'rotate-x', UPDATE_GL);
    init_angle_slider(GETTER_SETTER(ROTATE_Y), 'rotate-y', UPDATE_GL);
    init_angle_slider(GETTER_SETTER(ROTATE_Z), 'rotate-z', UPDATE_GL);

    init_coord_slider(GETTER_SETTER(TRANSLATE_X), 'translate-x', UPDATE_GL);
    init_coord_slider(GETTER_SETTER(TRANSLATE_Y), 'translate-y', UPDATE_GL);
    init_coord_slider(GETTER_SETTER(TRANSLATE_Z), 'translate-z', UPDATE_GL);

    $('#' + PROJECTION).prop('checked', true);
    $('form#projection input[name=projection]').on('change', function(e) {
        let elem   = $(e.target);
        PROJECTION = elem.attr('id');
        update(gl);
    });

    init_color_picker(GETTER_SETTER(AMBIANT_COLOR), 'light-ambiant-color', UPDATE_GL);

    init_direc_slider(GETTER_SETTER(DIRECT_X), 'light-direct-x', UPDATE_GL);
    init_direc_slider(GETTER_SETTER(DIRECT_Y), 'light-direct-y', UPDATE_GL);
    init_direc_slider(GETTER_SETTER(DIRECT_Z), 'light-direct-z', UPDATE_GL);

    init_color_picker(GETTER_SETTER(DIRECT_COLOR), 'light-direct-color', UPDATE_GL);

    init_coord_slider(GETTER_SETTER(POINT_X), 'light-point-x', UPDATE_GL);
    init_coord_slider(GETTER_SETTER(POINT_Y), 'light-point-y', UPDATE_GL);
    init_coord_slider(GETTER_SETTER(POINT_Z), 'light-point-z', UPDATE_GL);
    init_color_picker(GETTER_SETTER(POINT_COLOR), 'light-point-color', UPDATE_GL);

    $('#' + light.AMBIANT).prop('checked', LIGHT.ambiant);
    $('#' + light.AMBIANT).on('change', function(e) {
        LIGHT.ambiant = $(e.target).prop('checked');
        update(gl);
    });

    $('#' + light.DIRECT).prop('checked', LIGHT.direct);
    $('#' + light.DIRECT).on('change', function(e) {
        LIGHT.direct = $(e.target).prop('checked');
        update(gl);
    });

    $('#' + light.POINT).prop('checked', LIGHT.point);
    $('#' + light.POINT).on('change', function(e) {
        LIGHT.point = $(e.target).prop('checked');
        update(gl);
    });

    init_range({
        id: 'light-specular-power',
        value: SPECULAR_POWER,
        min: 2,
        max: 32,
        step: 2,

        parse: function(value) {
            SPECULAR_POWER = parseInt(value);
            value          = SPECULAR_POWER.toString();
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

    $('#' + light.SPECULAR).prop('checked', LIGHT.specular);
    $('#' + light.SPECULAR).on('change', function(e) {
        LIGHT.specular = $(e.target).prop('checked');
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

    update(gl);
}

function init_angle_slider(var_fn, range_id, render_fn) {
    init_range({
        id: range_id,
        value: var_fn(),
        min: -180,
        max: 180,
        step: 10,

        parse: function(value) {
            var_fn(parseInt(value));
            value = Math.abs(var_fn()).toString();
            switch (value.length) {
            case 1:
                value = '00' + value;
                break;
            case 2:
                value =  '0' + value;
                break;
            }
            if (var_fn() >= 0)
                value = '+' + value;
            else
                value = '-' + value;
            return value;
        },

        update: function() {
            render_fn();
        }
    });
}

function init_coord_slider(var_fn, range_id, render_fn) {
    init_range({
        id: range_id,
        value: var_fn(),
        min: -250,
        max: 250,
        step: 5,

        parse: function(value) {
            var_fn(parseInt(value));
            value = Math.abs(var_fn()).toString();
            switch (value.length) {
            case 1:
                value = '00' + value;
                break;
            case 2:
                value =  '0' + value;
                break;
            }
            if (var_fn() >= 0)
                value = '+' + value;
            else
                value = '-' + value;
            return value;
        },

        update: function() {
            render_fn();
        }
    });
}

function init_direc_slider(var_fn, range_id, render_fn) {
    init_range({
        id: range_id,
        value: var_fn(),
        min: -100,
        max: 100,
        step: 1,

        parse: function(value) {
            var_fn(parseInt(value));
            value = Math.abs(var_fn()).toString();
            switch (value.length) {
            case 1:
                value = '00' + value;
                break;
            case 2:
                value =  '0' + value;
                break;
            }
            if (var_fn() >= 0)
                value = '+' + value;
            else
                value = '-' + value;
            return value;
        },

        update: function() {
            render_fn();
        }
    });
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

    let view = Matrix.lookAt({
        eye:     CAMERA_EYE,
        center:  CAMERA_CENTER,
        up:      CAMERA_UP
    });

    let proj;

    switch (PROJECTION) {
    case projection.ORTHOGRAPHIC:
        proj = Matrix.ortho({
            left: -250,
            right: 250,
            bottom: -250,
            top: 250,
            near: 1,
            far: 1000
        });
        break;
    case projection.PERSPECTIVE:
        proj = Matrix.perspective({
            fovy: Radians.fromDegrees(60),
            aspect: 1,
            near: 1,
            far: 1000
        });
        break;
    }

    let sides = 50;
    let obj;

    switch (SHAPE) {
    case shape.CYLINDER:
        let left_end  = new Vector(-150,  0);
        let right_end = new Vector( 150,  0);
        let cylinder  = new Cylinder(left_end, right_end, 50);

        obj = cylinder.toTriangles(sides);
        break;
    case shape.SPHERE:
        let sphere = new Sphere(ORIGIN, 100);

        obj = sphere.toTriangles(sides, sides);
        break;
    }

    obj.color      = new RGBColor(0.2, 0.2, 1.0);
    obj.model      = model;
    obj.view       = view;
    obj.projection = proj;

    let lights = {};

    if (LIGHT.ambiant)
        lights.ambiant  = new AmbiantLight(AMBIANT_COLOR);
    else
        lights.ambiant  = null;

    if (LIGHT.direct)
        lights.direct   = new DirectLight(new Vector(DIRECT_X, DIRECT_Y, DIRECT_Z),
                                         DIRECT_COLOR);
    else
        lights.direct   = null;

    if (LIGHT.point)
        lights.point    = new PointLight(new Vector(POINT_X, POINT_Y, POINT_Z),
                                        POINT_COLOR);
    else
        lights.point    = null;

    if (LIGHT.specular)
        lights.specular = new SpecularLight(SPECULAR_POWER);
    else
        lights.specular = null;

    switch (SHADING) {
    case shading.FLAT:
        render_flat(gl, obj, lights);
        break;
    case shading.GOURAUD:
        render_gouraud(gl, obj, lights);
        break;
    case shading.PHONG:
        render_phong(gl, obj, lights);
        break;
    case shading.NORMAL:
        render_normal(gl, obj);
        break;
    case shading.DEPTH:
        render_depth(gl, obj, 250, 50);
        break;
    case shading.EDGE:
        render_edge(gl, obj);
        break;
    }
}
