#include "shapes.js"
#include "collections.js"
#include "util.js"

#define GL_BLEND

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
let DEPTH          = 250;
let COLOR          = null;

let ROTATE_X       = 0;
let ROTATE_Y       = 0;
let ROTATE_Z       = 0;

let TRANSLATE_X    = 0;
let TRANSLATE_Y    = 0;
let TRANSLATE_Z    = 0;

let MODELS         = null;

let SELECTED       = null;
let FOCUSED        = null;

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
let POINT_Z        = 250;
let POINT_COLOR    = TRUE_WHITE.scale(0.8);

let SPECULAR_POWER = 12;

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
    FLAT:           'shading-flat',
    GOURAUD:        'shading-gouraud',
    PHONG:          'shading-phong',
    NORMAL:         'shading-normal',
    DEPTH:          'shading-depth',
    EDGE:           'shading-edge',
    EDGE_SELECTION: 'shading-edge-selection'
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
        let def = e.attr('data-default') || e.children('label').first().attr('for');
        set_current_tab(elem, def);

        e.children('label').each(function(i, elem) {
            let label_for = $(elem).attr('for');
            $(elem).click(function(ev) {
                if ($(ev.target).attr('data-disabled') !== 'disabled')
                    set_current_tab(e, label_for)
            });
        });
    });

    setupIOSOR('file-picker');
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

#ifdef GL_BLEND
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
#else
    gl.enable(gl.DEPTH_TEST);
#endif

    let width  = parseInt(WIDTH);
    let height = parseInt(HEIGHT);

    MODELS = new ModelList(function(i, model) {
        $('div#model-pane').append(`
            <div id="model-${i}" class="item">
                <label>${i}:</label>
                <input id="model-select-${i}" name="models" class="select" type="radio" />
                <label for="model-select-${i}">${model.getName()}</label>
                <input id="model-hide-${i}" name="models" type="checkbox" />
                <label for="model-hide-${i}"><i class="fas fa-eye-slash"></i></label>
                <button class="remove"><i class="fas fa-times"></i></button>
            </div>
        `);

        let selector = $(`#model-select-${i}`);
        selector.on('change', function(e) {
            if ($(e.target).prop('checked'))
                select_model(gl, i);
        });
        selector.prop('checked', true).change();

        $(`#model-hide-${i}`).on('change', function(e) {
            MODELS.at(i).visible(! $(e.target).prop('checked'));
            render(gl);
        });

        let controls = $(`div#model-${i}`);
        controls.children('.remove').click(function() {
            if (SELECTED === i)
                select_model(gl, null);
            controls.remove();
            MODELS.remove(i);
            render(gl);
        });
    });
    select_model(gl, null);

    {
        let sphere   = (new Sphere(ORIGIN, 100)).toTriangles(50, 50);
        let mySphere = new Model('My Sphere 1', sphere.indices, sphere.vertices, {
            color: new RGBColor(0.2, 0.2, 1.0, 0.8)
        });

        MODELS.insert(mySphere);
    }
    {
        let sphere   = (new Sphere(ORIGIN, 40)).toTriangles(50, 50);
        let mySphere = new Model('My Sphere 2', sphere.indices, sphere.vertices, {
            color: new RGBColor(0.2, 1.0, 0.2)
        });
        mySphere.setTranslateX(200);

        MODELS.insert(mySphere);
    }

    CANVAS.mousedown(function(e) {
        switch (e.which) {
        case 1:
            let mouse  = get_mouse_xy(CANVAS, e);
            let result = new Uint8Array(4);

            gl.readPixels(mouse.x, mouse.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, result);
            console.log('Clicked pixel color:', result);

            picking_render(gl);
            gl.readPixels(mouse.x, mouse.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, result);
            console.log('Alpha-picking pixel color:', result);

            let i = 255 - (result[3] + 1);
            if (i < 0) {
                $('form#models input.select').prop('checked', false);
                select_model(gl, null);
            } else {
                $(`#model-select-${i}`).prop('checked', true).change();
            }
            break;
        }
    });

    CANVAS.mousemove(function(e) {
        let mouse  = get_mouse_xy(CANVAS, e);
        let result = new Uint8Array(4);

        picking_render(gl);
        gl.readPixels(mouse.x, mouse.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, result);

        let i = 255 - (result[3] + 1);
        if (i < 0) {
            FOCUSED = null;
        } else {
            FOCUSED = i;
            console.log('Focused model:', FOCUSED);
        }
        render(gl);
    });

    init_angle_slider(GETTER_SETTER(ROTATE_X), 'rotate-world-x', RENDER);
    init_angle_slider(GETTER_SETTER(ROTATE_Y), 'rotate-world-y', RENDER);
    init_angle_slider(GETTER_SETTER(ROTATE_Z), 'rotate-world-z', RENDER);

    init_space_slider(width,  GETTER_SETTER(TRANSLATE_X), 'translate-world-x', RENDER);
    init_space_slider(height, GETTER_SETTER(TRANSLATE_Y), 'translate-world-y', RENDER);
    init_space_slider(DEPTH,  GETTER_SETTER(TRANSLATE_Z), 'translate-world-z', RENDER);

    $('#' + PROJECTION).prop('checked', true);
    $('form#projection input[name=projection]').on('change', function(e) {
        let elem   = $(e.target);
        PROJECTION = elem.attr('id');
        render(gl);
    });

    init_color_picker(GETTER_SETTER(AMBIANT_COLOR), 'light-ambiant-color', RENDER);

    init_direc_slider(GETTER_SETTER(DIRECT_X), 'light-direct-x', RENDER);
    init_direc_slider(GETTER_SETTER(DIRECT_Y), 'light-direct-y', RENDER);
    init_direc_slider(GETTER_SETTER(DIRECT_Z), 'light-direct-z', RENDER);

    init_color_picker(GETTER_SETTER(DIRECT_COLOR), 'light-direct-color', RENDER);

    init_space_slider(width,  GETTER_SETTER(POINT_X), 'light-point-x', RENDER);
    init_space_slider(height, GETTER_SETTER(POINT_Y), 'light-point-y', RENDER);
    init_space_slider(DEPTH,  GETTER_SETTER(POINT_Z), 'light-point-z', RENDER);

    init_color_picker(GETTER_SETTER(POINT_COLOR), 'light-point-color', RENDER);

    $('#' + light.AMBIANT).prop('checked', LIGHT.ambiant);
    $('#' + light.AMBIANT).on('change', function(e) {
        LIGHT.ambiant = $(e.target).prop('checked');
        render(gl);
    });

    $('#' + light.DIRECT).prop('checked', LIGHT.direct);
    $('#' + light.DIRECT).on('change', function(e) {
        LIGHT.direct = $(e.target).prop('checked');
        render(gl);
    });

    $('#' + light.POINT).prop('checked', LIGHT.point);
    $('#' + light.POINT).on('change', function(e) {
        LIGHT.point = $(e.target).prop('checked');
        render(gl);
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
            render(gl);
        }
    });

    $('#' + light.SPECULAR).prop('checked', LIGHT.specular);
    $('#' + light.SPECULAR).on('change', function(e) {
        LIGHT.specular = $(e.target).prop('checked');
        render(gl);
    });

    $('#' + SHADING).prop('checked', true);
    $('form#shading-type input[name=shading-type]').on('change', function(e) {
        let elem = $(e.target);
        SHADING  = elem.attr('id');
        render(gl);
    });

    $('#' + SHAPE).prop('checked', true);
    $('form#shape-type input[name=shape-type]').on('change', function(e) {
        let elem = $(e.target);
        SHAPE    = elem.attr('id');
        render(gl);
    });

    render(gl);
}

function select_model(gl, i) {
    const SCALE = 5;

    if (i < 0)
        i = null;
    SELECTED = i;
    console.log('Selected model:', SELECTED);

    let width  = parseInt(WIDTH);
    let height = parseInt(HEIGHT);
    if (i === null) {
        init_angle_slider(CONST(0), 'rotate-model-x', VOID);
        init_angle_slider(CONST(0), 'rotate-model-y', VOID);
        init_angle_slider(CONST(0), 'rotate-model-z', VOID);

        init_space_slider(width,  CONST(0), 'translate-model-x', VOID);
        init_space_slider(height, CONST(0), 'translate-model-y', VOID);
        init_space_slider(DEPTH,  CONST(0), 'translate-model-z', VOID);
        
        init_scale_slider(SCALE, CONST(1), 'scale-model-x', VOID);
        init_scale_slider(SCALE, CONST(1), 'scale-model-y', VOID);
        init_scale_slider(SCALE, CONST(1), 'scale-model-z', VOID);

        $('div#editor input[type=range]').prop('disabled', true);
    } else {
        let model_space_slider = function(delta, getterName, setterName, sliderID) {
            init_space_slider(delta, function(value) {
                let model = MODELS.at(i);

                if (value !== undefined) {
                    model[setterName](value);
                } else {
                    return model[getterName]();
                }
            }, sliderID, RENDER);
        };

        let model_scale_slider = function(getterName, setterName, sliderID) {
            init_scale_slider(SCALE, function(value) {
                let model = MODELS.at(i);

                if (value !== undefined) {
                    model[setterName](value);
                } else {
                    return model[getterName]();
                }
            }, sliderID, RENDER);
        };

        model_space_slider(width,  'getTranslateX', 'setTranslateX', 'translate-model-x');
        model_space_slider(height, 'getTranslateY', 'setTranslateY', 'translate-model-y');
        model_space_slider(DEPTH,  'getTranslateZ', 'setTranslateZ', 'translate-model-z');

        model_scale_slider('getScaleX', 'setScaleX', 'scale-model-x');
        model_scale_slider('getScaleY', 'setScaleY', 'scale-model-y');
        model_scale_slider('getScaleZ', 'setScaleZ', 'scale-model-z');
    }
    render(gl);
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

function init_space_slider(delta, var_fn, range_id, render_fn) {
    init_range({
        id: range_id,
        value: var_fn(),
        min: -delta,
        max: delta,
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

function init_scale_slider(delta, var_fn, range_id, render_fn) {
    init_range({
        id: range_id,
        value: var_fn(),
        min: 0,
        max: delta,
        step: 0.05,

        parse: function(value) {
            var_fn(parseFloat(value));
            return Math.abs(var_fn()).toFixed(2);
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


function render(gl) {
    clear(gl, COLOR);

    let world = new Matrix();
    world     = world.rotateX(Radians.fromDegrees(ROTATE_X));
    world     = world.rotateY(Radians.fromDegrees(ROTATE_Y));
    world     = world.rotateZ(Radians.fromDegrees(ROTATE_Z));
    {
        let vec = new Vector(TRANSLATE_X, TRANSLATE_Y, TRANSLATE_Z);
        world   = world.translate(vec);
    }

    let view = Matrix.lookAt({
        eye:     CAMERA_EYE,
        center:  CAMERA_CENTER,
        up:      CAMERA_UP
    });

    let width  = parseInt(WIDTH);
    let height = parseInt(HEIGHT);
    let proj;

    switch (PROJECTION) {
    case projection.ORTHOGRAPHIC:
        proj = Matrix.ortho({
            left: -(width / 2),
            right: width / 2,
            bottom: -(height / 2),
            top: height / 2,
            near: 1,
            far: 1000
        });
        break;
    case projection.PERSPECTIVE:
        proj = Matrix.perspective({
            fovy: Radians.fromDegrees(60),
            aspect: width / height,
            near: 1,
            far: 1000
        });
        break;
    }

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

    MODELS.mapVisible(function(i, model) {
        let color         = model.getColor();

        switch (SHADING) {
        case shading.FLAT:
            render_flat(gl, model, color, world, view, proj, lights);
            break;
        case shading.GOURAUD:
            render_gouraud(gl, model, color, world, view, proj, lights);
            break;
        case shading.PHONG:
            render_phong(gl, model, color, world, view, proj, lights);
            break;
        case shading.NORMAL:
            render_normal(gl, model, world, view, proj);
            break;
        case shading.DEPTH:
            render_depth(gl, model, color, world, view, proj, 250, 50);
            break;
        case shading.EDGE:
            render_edge(gl, model, TRUE_BLACK, color, 1/2, world, view, proj);
            break;
        case shading.EDGE_SELECTION:
            render_edge_selection(gl, i, model, color, world, view, proj);
        }
    });
}

function render_edge_selection(gl, i, model, color, world, view, projection) {
    color = color.scale(0.5);

    let selectedColor = WHITE.scale(0.8);
    let focusedColor  = selectedColor.scale(0.8);

    if (i === SELECTED) {
        render_edge(gl, model, color, selectedColor, 1/2, world, view, projection);
    } else if (i === FOCUSED) {
        render_edge(gl, model, color, focusedColor, 1/8, world, view, projection);
    } else {
        render_edge(gl, model, color, TRUE_BLACK, 0, world, view, projection);
    }
}

function picking_render(gl) {
    clear(gl, TRUE_BLACK);

    let world = new Matrix();
    world     = world.rotateX(Radians.fromDegrees(ROTATE_X));
    world     = world.rotateY(Radians.fromDegrees(ROTATE_Y));
    world     = world.rotateZ(Radians.fromDegrees(ROTATE_Z));
    {
        let vec = new Vector(TRANSLATE_X, TRANSLATE_Y, TRANSLATE_Z);
        world   = world.translate(vec);
    }

    let view = Matrix.lookAt({
        eye:     CAMERA_EYE,
        center:  CAMERA_CENTER,
        up:      CAMERA_UP
    });

    let width  = parseInt(WIDTH);
    let height = parseInt(HEIGHT);
    let proj;

    switch (PROJECTION) {
    case projection.ORTHOGRAPHIC:
        proj = Matrix.ortho({
            left: -(width / 2),
            right: width / 2,
            bottom: -(height / 2),
            top: height / 2,
            near: 1,
            far: 1000
        });
        break;
    case projection.PERSPECTIVE:
        proj = Matrix.perspective({
            fovy: Radians.fromDegrees(60),
            aspect: width / height,
            near: 1,
            far: 1000
        });
        break;
    }

    let lights = {
        ambiant:  null,
        direct:   null,
        point:    null,
        specular: null
    };

    MODELS.mapVisible(function(i, model) {
        let color = TRUE_BLACK.copy().setAlpha((255 - (i + 1)) / 255);
        render_flat(gl, model, color, world, view, proj, lights);
    });
}
