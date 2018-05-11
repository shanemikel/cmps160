#pragma once

#define LOAD_CSS_COLOR(GLOBAL_NAME, CSS_NAME)                      \
    GLOBAL_NAME = RGBColor.fromHex($('#g-colors').css(CSS_NAME));

#define INIT_ROTATE_SLIDER(GLOBAL_NAME, RANGE_ID, RENDER)    \
    init_range({                                             \
        id:     RANGE_ID,                                    \
        value:  0,                                           \
        min:    -180,                                        \
        max:    180,                                         \
        step:   10,                                          \
                                                             \
        parse: function(value) {                             \
            GLOBAL_NAME = parseInt(value);                   \
            value       = Math.abs(GLOBAL_NAME).toString();  \
            switch (value.length) {                          \
            case 1:                                          \
                value = '00' + value;                        \
                break;                                       \
            case 2:                                          \
                value =  '0' + value;                        \
                break;                                       \
            }                                                \
            if (GLOBAL_NAME >= 0)                            \
                value =  '+' + value;                        \
            else                                             \
                value =  '-' + value;                        \
            return value;                                    \
        },                                                   \
                                                             \
        update: function() {                                 \
            RENDER;                                          \
        }                                                    \
    });

#define INIT_TRANSLATE_SLIDER(GLOBAL_NAME, RANGE_ID, RENDER)  \
    init_range({                                              \
        id:     RANGE_ID,                                     \
        value:  0,                                            \
        min:    -250,                                         \
        max:    250,                                          \
        step:   5,                                            \
                                                              \
        parse: function(value) {                              \
            GLOBAL_NAME = parseInt(value);                    \
            value       = Math.abs(GLOBAL_NAME).toString();   \
            switch (value.length) {                           \
            case 1:                                           \
                value = '00' + value;                         \
                break;                                        \
            case 2:                                           \
                value =  '0' + value;                         \
                break;                                        \
            }                                                 \
            if (GLOBAL_NAME >= 0)                             \
                value =  '+' + value;                         \
            else                                              \
                value =  '-' + value;                         \
            return value;                                     \
        },                                                    \
                                                              \
        update: function() {                                  \
            RENDER;                                           \
        }                                                     \
    });

#define INIT_SHADERS(GL, VERTEX_SHADER, FRAGMENT_SHADER)      \
    if (! initShaders(GL, VERTEX_SHADER, FRAGMENT_SHADER)) {  \
        console.log('Failed to intialize shaders.');          \
        return;                                               \
    }

#define GET_ATTRIBUTE(VAR_NAME, GL, SHADER_NAME)                              \
    let VAR_NAME = GL.getAttribLocation(GL.program, SHADER_NAME);             \
    if (VAR_NAME < 0) {                                                       \
        console.log('Failed to get the storage location of ' + SHADER_NAME);  \
        return;                                                               \
    }

#define GET_UNIFORM(VAR_NAME, GL, SHADER_NAME)                                \
    let VAR_NAME = GL.getUniformLocation(GL.program, SHADER_NAME);            \
    if (! VAR_NAME) {                                                         \
        console.log('Failed to get the storage location of ' + SHADER_NAME);  \
        return;                                                               \
    }

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

    gl.clearColor(color.r, color.g, color.b, color.a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function render_obj_flat(gl, obj, xform, lights, color) {
    color = color ? color.copy() : WHITE.copy();

    let VSHADER = `#version 100
        attribute vec4 a_Position;
        attribute vec4 a_Normal;

        uniform   mat4 u_Transform;
        uniform   vec4 u_FaceColor;
        uniform   vec3 u_LightDirection;
        uniform   vec3 u_LightColor;

        varying   vec4 v_FragColor;

        void main(void)
        {
            gl_Position = u_Transform * a_Position;
            vec4 normal = u_Transform * a_Normal;

            v_FragColor     = u_FaceColor;
            float intensity = dot(u_LightDirection, normal.xyz);

            if (intensity > 0.0) {
                vec3 light   = intensity * u_LightColor;
                v_FragColor += vec4(light, 1.0);
            }
        }`;

    let FSHADER = `#version 100
        precision mediump float;

        varying vec4 v_FragColor;

        void main(void)
        {
            gl_FragColor = v_FragColor;
        }    
    `;

    INIT_SHADERS(gl, VSHADER, FSHADER)
    GET_ATTRIBUTE(a_Position, gl, 'a_Position')
    GET_ATTRIBUTE(a_Normal,   gl, 'a_Normal')

    GET_UNIFORM(u_Transform,      gl, 'u_Transform')
    GET_UNIFORM(u_FaceColor,      gl, 'u_FaceColor')
    GET_UNIFORM(u_LightDirection, gl, 'u_LightDirection')
    GET_UNIFORM(u_LightColor,     gl, 'u_LightColor')

    let direct_light   = lights.direct;
    let dl_dir         = direct_light.getDirection();
    let dl_col         = direct_light.getColor();

    color = color.scale(lights.ambiant);
    
    gl.uniformMatrix4fv(u_Transform, false, xform.transpose().data);
    gl.uniform4f(u_FaceColor, color.r, color.g, color.b, color.a);
    gl.uniform3f(u_LightDirection, dl_dir.x, dl_dir.y, dl_dir.z);
    gl.uniform3f(u_LightColor, dl_col.r, dl_col.g, dl_col.b);

    let buffer = {
        vertices: gl.createBuffer(),
        normals:  gl.createBuffer()
    };
    if (! buffer.vertices || ! buffer.normals) {
        console.log('Failed to create the buffer objects');
        return;
    }

    let normals  = [];
    let vertices = [];
    let count    = obj.indices.length;
    for (let i = 0; i < count / 3; i++) {
        let i0 = obj.indices[3 * i + 0];
        let i1 = obj.indices[3 * i + 1];
        let i2 = obj.indices[3 * i + 2];

        let v0 = obj.vertices[i0];
        let v1 = obj.vertices[i1];
        let v2 = obj.vertices[i2];

        let normal = v2.sub(v0).cross(v1.sub(v0)).unit();
        normal.w   = 0;

        vertices.push(v0);
        normals.push(normal);

        vertices.push(v1);
        normals.push(normal);

        vertices.push(v2);
        normals.push(normal);
    }
    normals  = Vector.flatten(normals);
    vertices = Vector.flatten(vertices);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STREAM_DRAW);
    gl.vertexAttribPointer(a_Normal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, count);

    gl.deleteBuffer(buffer.normals);
    gl.deleteBuffer(buffer.vertices);
}

function render_obj(gl, mode, obj, xform, color) {
    color = color ? color.copy() : WHITE.copy();

    let VSHADER = `
        attribute vec4 a_Position;
        uniform mat4 u_Transform;
        void main() {
            gl_Position = u_Transform * a_Position;
        }
    `;
    let FSHADER = `
        precision mediump float;
        uniform vec4 u_FragColor;
        void main() {
            gl_FragColor = u_FragColor;
        }    
    `;
    INIT_SHADERS(gl, VSHADER, FSHADER)
    GET_ATTRIBUTE(a_Position, gl, 'a_Position')

    GET_UNIFORM(u_Transform, gl, 'u_Transform')
    GET_UNIFORM(u_FragColor, gl, 'u_FragColor')

    gl.uniformMatrix4fv(u_Transform, false, xform.transpose().data);
    gl.uniform4f(u_FragColor, color.r, color.g, color.b, color.a);

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
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
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
    color = color ? color.copy() : WHITE.copy();

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
    INIT_SHADERS(gl, VSHADER, FSHADER)
    GET_ATTRIBUTE(a_Position, gl, 'a_Position')

    GET_UNIFORM(u_FragColor, gl, 'u_FragColor')

    gl.uniform4f(u_FragColor, color.r, color.g, color.b, color.a);

    let vertexBuffer = gl.createBuffer();
    if (! vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }

    let buffer = flatten_f32(3, vertices);
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
    color = color ? color.copy() : WHITE.copy();

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
    INIT_SHADERS(gl, VSHADER, FSHADER)
    GET_ATTRIBUTE(a_Position, gl, 'a_Position')

    GET_UNIFORM(u_FragColor, gl, 'u_FragColor')
    GET_UNIFORM(u_PointSize, gl, 'u_PointSize')

    gl.uniform1f(u_PointSize, point_size);
    gl.uniform4f(u_FragColor, color.r, color.g, color.b, color.a);

    let vertexBuffer = gl.createBuffer();
    if (! vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }

    let buffer = flatten_f32(3, vertices);
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
