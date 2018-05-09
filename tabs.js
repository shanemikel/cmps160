#include "shapes.js"
#include "util.js"


let WHITE       = null;
let BLACK       = null;
let RED         = null;
let GREEN       = null;
let BLUE        = null;
let GREY        = null;
let DARK_GREY   = null;
let LIGHT_GREY  = null;

let g_canvas = null;

let WIDTH  = null;
let HEIGHT = null;
let COLOR  = null;


function init() {
    WHITE       = RGBColor.fromHex($('#g-colors').css('--white'));
    BLACK       = RGBColor.fromHex($('#g-colors').css('--black'));
    RED         = RGBColor.fromHex($('#g-colors').css('--red'));
    GREEN       = RGBColor.fromHex($('#g-colors').css('--green'));
    BLUE        = RGBColor.fromHex($('#g-colors').css('--blue'));
    GREY        = RGBColor.fromHex($('#g-colors').css('--grey'));
    DARK_GREY   = RGBColor.fromHex($('#g-colors').css('--dark-grey'));
    LIGHT_GREY  = RGBColor.fromHex($('#g-colors').css('--light-grey'));

    WIDTH  = $('#g-webgl').css('width');
    HEIGHT = $('#g-webgl').css('height');
    COLOR  = RGBColor.fromHex($('#g-webgl').css('--background-color'));

    g_canvas = $('#webgl');
    g_canvas.attr('width'  , WIDTH);
    g_canvas.attr('height' , HEIGHT);

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
};


function main() {
    init();

    let gl = getWebGLContext(g_canvas[0]);
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

    render_test(gl);

    // let o1 = (new Circle(ORIGIN, 0.5)).toTrigs(4);
    // console.log(o1);
    // render_obj(gl, gl.LINES, o1);
}

function render_test(gl) {
    let VSHADER = `
        attribute vec4 a_Position;
        void main() {
            gl_Position = a_Position;
        }
    `;
    let FSHADER = `
        precision mediump float;
        uniform vec4 u_FragColor;
        void main() {
            gl_FragColor = u_FragColor;
        }    
    `;
    initShaders(gl, VSHADER, FSHADER);

    let a_Position  = gl.getAttribLocation(gl.program, 'a_Position');

    let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    {
        let color = WHITE.copy();
        gl.uniform4f(u_FragColor, color.r, color.g, color.b, 1.0);
    }

    let buffers = {
        vertices: gl.createBuffer(),
        indices:  gl.createBuffer()
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
    {
        let vertices = new Float32Array([
            -0.5,  0.5, 0.0,    0.5,  0.5, 0.0,
            -0.5, -0.5, 0.0,    0.5, -0.5, 0.0 
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
    }

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    {
        let count   = 6;
        let indices = new Uint16Array([
            0, 1, 2,    1, 2, 3
        ]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    }

    gl.deleteBuffer(buffers.indices);
    gl.deleteBuffer(buffers.vertices);
}

function render_obj(gl, mode, obj, color) {
    color = color ? color.copy() : WHITE.copy();

    let VSHADER = `
        attribute vec4 a_Position;
        void main() {
            gl_Position = a_Position;
        }
    `;
    let FSHADER = `
        precision mediump float;
        uniform vec4 u_FragColor;
        void main() {
            gl_FragColor = u_FragColor;
        }    
    `;
    if (! initShaders(gl, VSHADER, FSHADER)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (! u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    gl.uniform4f(u_FragColor, color.r, color.g, color.b, 1.0);

    let buffers = {
        vertices: gl.createBuffer(),
        indices:  gl.createBuffer()
    };
    if (! buffers.vertices || ! buffers.indices) {
        console.log('Failed to create the buffer objects');
        return;
    }

    let vertices = flattenF32(3, obj.vertices);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    let indices = new Uint16Array(obj.indices);
    let count   = obj.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);
    gl.drawElements(mode, count, gl.UNSIGNED_SHORT, 0);

    gl.deleteBuffer(buffers.indices);
    gl.deleteBuffer(buffers.vertices);
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
