#include "util.js"


var WHITE       = null;
var BLACK       = null;
var RED         = null;
var GREEN       = null;
var BLUE        = null;
var GREY        = null;
var DARK_GREY   = null;
var LIGHT_GREY  = null;

var g_canvas = null;

var WIDTH  = null;
var HEIGHT = null;
var COLOR  = null;


function init() {
    WHITE       = hex2rgb($('#g-colors').css('--white'));
    BLACK       = hex2rgb($('#g-colors').css('--black'));
    RED         = hex2rgb($('#g-colors').css('--red'));
    GREEN       = hex2rgb($('#g-colors').css('--green'));
    BLUE        = hex2rgb($('#g-colors').css('--blue'));
    GREY        = hex2rgb($('#g-colors').css('--grey'));
    DARK_GREY   = hex2rgb($('#g-colors').css('--dark-grey'));
    LIGHT_GREY  = hex2rgb($('#g-colors').css('--light-grey'));

    WIDTH  = $('#g-webgl').css('width');
    HEIGHT = $('#g-webgl').css('height');
    COLOR  = hex2rgb($('#g-webgl').css('--background-color'));

    g_canvas = $('#webgl');
    g_canvas.attr('width'  , WIDTH);
    g_canvas.attr('height' , HEIGHT);

    $('span.spacer').each(function(i, elem) {
        var e = $(elem);
        e.css('width', e.attr('data-size') || e.css('--size'));
    });

    $('.tab-labels').each(function(i, elem) {
        var e   = $(elem);
        var def = e.attr('data-default');
        set_current_tab(elem, def);

        e.children('label').each(function(i, elem) {
            var label_for = $(elem).attr('for');
            $(elem).click(() => set_current_tab(e, label_for));
        });
    });
}

function set_current_tab(tabs_elem, label_for) {
    $(tabs_elem).children('label').each(function(i, elem) {
        var e = $(elem);
        if (e.attr('for') !== label_for)
            e.removeClass('current');
        else
            e.addClass('current');
    });
    $(tabs_elem).nextAll('.tab').each(function(i, elem) {
        var e = $(elem);
        if (e.attr('id') !== label_for)
            e.prop('hidden', true);
        else
            e.prop('hidden', false);
    });
};


function main() {
    init();

    var gl = getWebGLContext(g_canvas[0]);
    if (! gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    start(gl);
}

function start(gl) {
    if (! initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    setup_callbacks(gl);
    render(gl);
}

function setup_callbacks(gl) {}


function render(gl, mouse_xy) {
    clear(gl, COLOR);

    render_grid(gl, DARK_GREY);
}

function render_grid(gl, color) {
    var vertices = [];
    vertices.push([-1.0,  0.0, 0.0]);
    vertices.push([ 1.0,  0.0, 0.0]);
    vertices.push([ 0.0, -1.0, 0.0]);
    vertices.push([ 0.0,  1.0, 0.0]);
    render_lines(gl, 2, vertices, color);

    vertices = [];
    var tick_length = 0.5;
    var tick_space  = 0.1;
    for (var i = 1; i <= 2 / tick_space - 1; i++) {
        var tick = i * tick_space - 1;

        vertices.push([-tick_length, tick, 0.0]);
        vertices.push([ tick_length, tick, 0.0]);

        vertices.push([tick, -tick_length, 0.0]);
        vertices.push([tick,  tick_length, 0.0]);
    }
    render_lines(gl, 1, vertices, color);
}
