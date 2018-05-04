#pragma once


var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n'     +
    'uniform float u_PointSize;\n'     +
    'void main() {\n'                  +
    '  gl_Position = a_Position;\n'    +
    '  gl_PointSize = u_PointSize;\n'  +
    '}';

var FSHADER_SOURCE =
    'precision mediump float;\n'       +
    'uniform vec4 u_FragColor;\n'      +
    'void main() {\n'                  +
    '  gl_FragColor = u_FragColor;\n'  +
    '}';

function clear(gl, color) {
    var color = color || BLACK;

    gl.clearColor(color[0], color[1], color[2], color[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function render_vertices(gl, mode, vertices, color) {
    color = color || WHITE;

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (! u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    var vertexBuffer = gl.createBuffer();
    if (! vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }

    var buffer = flatten(3, vertices);
    var count  = vertices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
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

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    var u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
    if (! u_PointSize) {
        console.log('Failed to get the storage location of u_PointSize');
        return;
    }
    gl.uniform1f(u_PointSize, point_size);

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (! u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    var vertexBuffer = gl.createBuffer();
    if (! vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }

    var buffer = flatten(3, vertices);
    var count  = vertices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.POINTS, 0, count);
    gl.deleteBuffer(vertexBuffer);
}


function get_mouse_xy(canvas, ev) {
    var x    = ev.clientX;
    var y    = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width() / 2) / (canvas.width() / 2);
    y = (canvas.height() / 2 - (y - rect.top)) / (canvas.height() / 2);
    return [x, y];
}

function flatten(n, arr) {
    /**  Flatten a list of n-lists (n-dimensional vectors) into a Float32Array
     */
    var res = new Float32Array(arr.length * n);
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < n; j++)
            res[n * i + j] = arr[i][j];
    }
    return res;
}

function degrees2radians(degrees) {
    return degrees * Math.PI / 180;
}

function hex2rgb(hex) {
    // 'hexToRgb' function copied from 'https://stackoverflow.com/questions/5623838'
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    var rgb = hexToRgb(hex.trim());
    rgb = [rgb.r, rgb.g, rgb.b];
    for (var i = 0; i < rgb.length; i++)
        rgb[i] /= 255;
    rgb.push(1.0);

    return rgb;
}

function vector2string(v) {
    return "{" + v[0] + ", " + v[1] + ", " + v[2] + "}";
}
