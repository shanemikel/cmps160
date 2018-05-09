#pragma once

#define LOAD_CSS_COLOR(GLOBAL_NAME, CSS_NAME)                      \
    GLOBAL_NAME = RGBColor.fromHex($('#g-colors').css(CSS_NAME));

#define INIT_ROTATE_SLIDER(GLOBAL_NAME, RANGE_ID, RENDER)          \
    init_range({                                                   \
        id:     RANGE_ID,                                          \
        value:  0,                                                 \
        min:    -180,                                              \
        max:    180,                                               \
        step:   10,                                                \
                                                                   \
        parse: function(value) {                                   \
            GLOBAL_NAME = parseInt(value);                         \
            switch (value.length) {                                \
            case 1:                                                \
                value = '00' + value;                              \
                break;                                             \
            case 2:                                                \
                value =  '0' + value;                              \
                break;                                             \
            }                                                      \
            if (GLOBAL_NAME >= 0)                                  \
                value =  '+' + value;                              \
            return ' ' + value;                                    \
        },                                                         \
                                                                   \
        update: function() {                                       \
            RENDER;                                                \
        }                                                          \
    });

#define INIT_TRANSLATE_SLIDER(GLOBAL_NAME, RANGE_ID, RENDER)       \
    init_range({                                                   \
        id:     RANGE_ID,                                          \
        value:  0,                                                 \
        min:    -1,                                                \
        max:    1,                                                 \
        step:   0.05,                                              \
                                                                   \
        parse: function(value) {                                   \
            GLOBAL_NAME = parseFloat(value);                       \
            value       = GLOBAL_NAME.toFixed(2);                  \
            if (GLOBAL_NAME >= 0)                                  \
                value   = '+' + value;                             \
            return value;                                          \
        },                                                         \
                                                                   \
        update: function() {                                       \
            RENDER;                                                \
        }                                                          \
    });

function init_range(args) {
    let parse  = args.parse;
    let update = args.update;
    let range  = $('#' + args.id);
    let label  = $('label[for=' + args.id + ']');

    range.val(args.value);
    range.attr('min'  , args.min);
    range.attr('max'  , args.max);
    range.attr('step' , args.step);

    range.change(function() {
        label.text('(' + parse(range.val()) + ')');
        if (update !== undefined) update();
    });
    range.on('input', function() {
        range.trigger('change');
    });
    range.trigger('change');
}


function clear(gl, color) {
    color = color ? color.copy() : BLACK.copy();

    gl.clearColor(color.r, color.g, color.b, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function render_obj(gl, mode, obj, xform, color) {
    color = color ? color.copy() : WHITE.copy();

    let VSHADER = `
        attribute vec3 a_Position;
        uniform mat4 u_Transform;
        void main() {
            gl_Position = u_Transform * vec4(a_Position.xyz, 1.0);
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

    let u_Transform = gl.getUniformLocation(gl.program, 'u_Transform');
    if (! u_Transform) {
        console.log('Failed to get the storage location of u_Transform');
        return;
    }
    gl.uniformMatrix4fv(u_Transform, gl.FALSE, xform.data);

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

    let vertices = Vector.flatten(obj.vertices);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, gl.FALSE, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    let indices = new Uint16Array(obj.indices);
    let count   = obj.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);
    gl.drawElements(mode, count, gl.UNSIGNED_SHORT, 0);

    gl.deleteBuffer(buffers.indices);
    gl.deleteBuffer(buffers.vertices);
}

function render_vertices(gl, mode, vertices, color) {
    color = color || WHITE;

    let VSHADER = `
        attribute vec4 a_Position;
        uniform float u_PointSize;
        void main() {
            gl_Position = a_Position;
            gl_PointSize = u_PointSize;
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

    let vertexBuffer = gl.createBuffer();
    if (! vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }

    let buffer = flatten_f32(3, vertices);
    let count  = vertices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, gl.FALSE, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(mode, 0, count);
    gl.deleteBuffer(vertexBuffer);
}

function render_lines(gl, width, vertices, color) {
    gl.lineWidth(width);
    render_vertices(gl, gl.LINES, vertices, color);
}

function render_line_strip(gl, width, vertices, color) {
    gl.lineWidth(width);
    render_vertices(gl, gl.LINE_STRIP, vertices, color);
}

function render_line_loop(gl, width, vertices, color) {
    gl.lineWidth(width);
    render_vertices(gl, gl.LINE_LOOP, vertices, color);
}

function render_triangles(gl, vertices, color) {
    render_vertices(gl, gl.TRIANGLES, vertices, color);
}

function render_triangle_strip(gl, vertices, color) {
    render_vertices(gl, gl.TRIANGLE_STRIP, vertices, color);
}

function render_triangle_fan(gl, vertices, color) {
    render_vertices(gl, gl.TRIANGLE_FAN, vertices, color);
}

function render_points(gl, point_size, vertices, color) {
    color = color || WHITE;

    let VSHADER = `
        attribute vec4 a_Position;
        uniform float u_PointSize;
        void main() {
            gl_Position = a_Position;
            gl_PointSize = u_PointSize;
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

    let u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
    if (! u_PointSize) {
        console.log('Failed to get the storage location of u_PointSize');
        return;
    }
    gl.uniform1f(u_PointSize, point_size);

    let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (! u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    gl.uniform4f(u_FragColor, color.r, color.g, color.b, 1.0);

    let vertexBuffer = gl.createBuffer();
    if (! vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }

    let buffer = flatten_f32(3, vertices);
    let count  = vertices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, gl.FALSE, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.POINTS, 0, count);
    gl.deleteBuffer(vertexBuffer);
}


function get_mouse_xy(canvas, ev) {
    let x    = ev.clientX;
    let y    = ev.clientY;
    let rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width() / 2) / (canvas.width() / 2);
    y = (canvas.height() / 2 - (y - rect.top)) / (canvas.height() / 2);
    return [x, y];
}

function flatten_f32(n, arr) {
    /**  Flatten an Array of sub-Arrays
     *   @param n the dimension (length of Array) of the sub-Arrays
     *   @param arr the Array of n-length Arrays
     *   @return a Float32Array
     */
    let res = new Float32Array(arr.length * n);
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < n; j++)
            res[n * i + j] = arr[i][j];
    }
    return res;
}
