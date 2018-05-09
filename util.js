#pragma once


let VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform float u_PointSize;
    void main() {
        gl_Position = a_Position;
        gl_PointSize = u_PointSize;
    }
`;

let FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
        gl_FragColor = u_FragColor;
    }
`;

function clear(gl, color) {
    color = color ? color.copy() : BLACK.copy();

    gl.clearColor(color.r, color.g, color.b, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function render_vertices(gl, mode, vertices, color) {
    color = color || WHITE;

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

    let buffer = flattenF32(3, vertices);
    let count  = vertices.length;

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

    let buffer = flattenF32(3, vertices);
    let count  = vertices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
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

function flattenF32(n, arr) {
    /**  Flatten a list of n-lists (n-dimensional vectors) into a Float32Array
     */
    let res = new Float32Array(arr.length * n);
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < n; j++)
            res[n * i + j] = arr[i][j];
    }
    return res;
}

function degrees2radians(degrees) {
    return degrees * Math.PI / 180;
}

function vector2string(v) {
    return "{" + v.x + ", " + v.y + ", " + v.z + "}";
}
