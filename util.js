#pragma once


#define ORIGIN (new Vector(0, 0, 0))


#define TRUE_WHITE (new RGBColor(1, 1, 1))
#define TRUE_BLACK (new RGBColor(0, 0, 0))
#define TRUE_RED   (new RGBColor(1, 0, 0))
#define TRUE_GREEN (new RGBColor(0, 1, 0))
#define TRUE_BLUE  (new RGBColor(0, 0, 1))

#define LOAD_CSS_COLOR(GLOBAL_NAME, CSS_NAME)                      \
    GLOBAL_NAME = RGBColor.fromHex($('#g-colors').css(CSS_NAME));


#define GETTER_SETTER(NAME)                                 \
    ((value) => value !== undefined ? NAME = value : NAME)

#define UPDATE_GL       \
    (() => update(gl))


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

    range.attr('min'  , args.min);
    range.attr('max'  , args.max);
    range.attr('step' , args.step);
    range.val(args.value);

    range.change(function() {
        label.text('(' + parse(range.val()) + ')');
        if (update !== undefined) update();
    });
    range.on('input', function() {
        range.trigger('change');
    });
    range.trigger('change');
}

function init_color_picker(var_fn, picker_id, render_fn) {
    let elem = $('#' + picker_id);
    elem.attr('value', var_fn().toHex());
    elem.on('input', function(e) {
        var_fn(RGBColor.fromHex(e.target.value));
        render_fn();
    });
}


function clear(gl, color) {
    color = color ? color.copy() : BLACK.copy();

    gl.clearColor(color.r, color.g, color.b, color.a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}


let render_flat    = render_obj(flat_and_gouraud_shaders(), normalize_obj_flat);
let render_gouraud = render_obj(flat_and_gouraud_shaders(), normalize_obj_average);
let render_phong   = render_obj(phong_shaders(), normalize_obj_average);

function phong_shaders() {
    let vert = `#version 100
        attribute vec4 a_Position;
        attribute vec4 a_Normal;
        attribute vec4 a_Color;

        uniform mat4  u_Model;
        uniform mat4  u_View;
        uniform mat4  u_Projection;

        varying vec4  v_Position;
        varying vec4  v_Color;
        varying vec4  v_Normal;

        void main(void)
        {
            v_Position = u_View * u_Model * a_Position;
            v_Normal   = u_View * u_Model * a_Normal;
            v_Color    = a_Color;

            gl_Position  = u_Projection * v_Position;
        }`;

    let frag = `#version 100
        precision mediump float;

        uniform vec3  u_AmbiantLightColor;

        uniform vec3  u_DirectLight;
        uniform vec3  u_DirectLightColor;

        uniform vec3  u_PointLight;
        uniform vec3  u_PointLightColor;

        uniform float u_SpecularPower;

        varying vec4  v_Position;
        varying vec4  v_Color;
        varying vec4  v_Normal;

        void main(void)
        {
            float directIntensity = max(dot(u_DirectLight, v_Normal.xyz), 0.0);

            vec3 pointDirection  = normalize(u_PointLight - v_Position.xyz);
            float pointIntensity = max(dot(pointDirection, v_Normal.xyz), 0.0);

            vec3 viewDirection      = normalize(v_Position.xyz);
            vec3 reflectDirection   = reflect(pointDirection, v_Normal.xyz);
            float specularIntensity = max(dot(viewDirection, reflectDirection), 0.0);

            vec3 light  = u_AmbiantLightColor;
            light      += directIntensity * u_DirectLightColor;
            light      += pointIntensity * u_PointLightColor;

            if (u_SpecularPower >= 0.0)
                light  += pow(specularIntensity, u_SpecularPower) * u_PointLightColor;

            gl_FragColor = vec4(v_Color.xyz * light, v_Color.a);
        }    
    `;

    return {vert: vert, frag: frag};
}

function flat_and_gouraud_shaders() {
    let vert = `#version 100
        attribute vec4 a_Position;
        attribute vec4 a_Normal;
        attribute vec4 a_Color;

        uniform mat4 u_Model;
        uniform mat4 u_View;
        uniform mat4 u_Projection;

        uniform vec3 u_AmbiantLightColor;

        uniform vec3 u_DirectLight;
        uniform vec3 u_DirectLightColor;

        uniform vec3 u_PointLight;
        uniform vec3 u_PointLightColor;

        uniform float u_SpecularPower;

        varying vec4 v_Color;

        void main(void)
        {
            gl_Position = u_View * u_Model * a_Position;
            vec4 normal = u_Model * a_Normal;
            vec3 color  = a_Color.rgb;

            float directIntensity = max(dot(u_DirectLight, normal.xyz), 0.0);

            vec3 pointDirection  = normalize(u_PointLight - a_Position.xyz);
            float pointIntensity = max(dot(pointDirection, normal.xyz), 0.0);

            vec3 viewDir            = normalize(gl_Position.xyz);
            vec3 reflectDir         = reflect(pointDirection, normal.xyz);
            float specularIntensity = max(dot(viewDir, reflectDir), 0.0);

            vec3 light  = u_AmbiantLightColor;
            light      += directIntensity * u_DirectLightColor;
            light      += pointIntensity * u_PointLightColor;

            if (u_SpecularPower >= 0.0)
                light  += pow(specularIntensity, u_SpecularPower) * u_PointLightColor;

            color      *= light;
            v_Color     = vec4(color, a_Color.a);

            gl_Position = u_Projection * gl_Position;
        }`;

    let frag = `#version 100
        precision mediump float;

        varying vec4 v_Color;

        void main(void)
        {
            gl_FragColor = v_Color;
        }    
    `;

    return {vert: vert, frag: frag};
}

function render_obj(shaders, normalize_fn) {
    return function(gl, obj, lights) {
        let color   = obj.color ? obj.color.copy() : WHITE.copy();
        let vert    = shaders.vert;
        let frag    = shaders.frag;

        INIT_SHADERS(gl, vert, frag)

        GET_ATTRIBUTE(a_Position,        gl, 'a_Position')
        GET_ATTRIBUTE(a_Normal,          gl, 'a_Normal')
        GET_ATTRIBUTE(a_Color,           gl, 'a_Color')

        GET_UNIFORM(u_Model,             gl, 'u_Model')
        GET_UNIFORM(u_View,              gl, 'u_View')
        GET_UNIFORM(u_Projection,        gl, 'u_Projection')

        GET_UNIFORM(u_AmbiantLightColor, gl, 'u_AmbiantLightColor')

        GET_UNIFORM(u_DirectLight,       gl, 'u_DirectLight')
        GET_UNIFORM(u_DirectLightColor,  gl, 'u_DirectLightColor')

        GET_UNIFORM(u_PointLight,        gl, 'u_PointLight')
        GET_UNIFORM(u_PointLightColor,   gl, 'u_PointLightColor')

        GET_UNIFORM(u_SpecularPower,     gl, 'u_SpecularPower')

        let ambiant_light;
        if (lights.ambiant !== null)
            ambiant_light  = lights.ambiant;
        else
            ambiant_light  = AmbiantLight.neutral();
        let al_col         = ambiant_light.getColor();

        let direct_light;
        if (lights.direct !== null)
            direct_light   = lights.direct;
        else
            direct_light   = DirectLight.neutral();
        let dl_dir         = direct_light.getDirection();
        let dl_col         = direct_light.getColor();

        let point_light;
        if (lights.point !== null)
            point_light    = lights.point;
        else
            point_light    = PointLight.neutral();
        let pl_pos         = point_light.getPosition();
        let pl_col         = point_light.getColor();

        let specular_light;
        if (lights.specular !== null)
            specular_light = lights.specular;
        else
            specular_light = SpecularLight.neutral();
        let sl_pow         = specular_light.getPower();

        gl.uniformMatrix4fv(u_Model, false, obj.model.flatten());
        gl.uniformMatrix4fv(u_View, false, obj.view.flatten());
        gl.uniformMatrix4fv(u_Projection, false, obj.projection.flatten());

        gl.uniform3f(u_AmbiantLightColor, al_col.r, al_col.g, al_col.b);

        gl.uniform3f(u_DirectLight, dl_dir.x, dl_dir.y, dl_dir.z);
        gl.uniform3f(u_DirectLightColor, dl_col.r, dl_col.g, dl_col.b);

        gl.uniform3f(u_PointLight, pl_pos.x, pl_pos.y, pl_pos.z);
        gl.uniform3f(u_PointLightColor, pl_col.r, pl_col.g, pl_col.b);

        gl.uniform1f(u_SpecularPower, sl_pow);

        let count = obj.indices.length;
        obj       = normalize_fn(obj);

        let vertices = Vector.flatten(obj.vertices);
        let normals  = Vector.flatten(obj.normals);

        let buffer = {
            vertices: gl.createBuffer(),
            normals:  gl.createBuffer(),
            colors:   gl.createBuffer()
        };
        if (! buffer.vertices || ! buffer.normals || ! buffer.colors) {
            console.log('Failed to create the buffer objects');
            return;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertices);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
        gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STREAM_DRAW);
        gl.vertexAttribPointer(a_Normal, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        let colors = [];
        for (let i = 0; i < count; i++)
            colors.push(color.copy());
        colors = RGBColor.flatten(colors);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.colors);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STREAM_DRAW);
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        gl.drawArrays(gl.TRIANGLES, 0, count);

        gl.disableVertexAttribArray(a_Color);
        gl.disableVertexAttribArray(a_Normal);
        gl.disableVertexAttribArray(a_Position);
        gl.deleteBuffer(buffer.colors);
        gl.deleteBuffer(buffer.normals);
        gl.deleteBuffer(buffer.vertices);
    }
}

function normalize_obj_average(obj, args) {
    /**  Make a Vertices/Normals OBJ from a Indices/Vertices OBJ
     *   @param obj.indices the index array
     *   @param obj.vertices the vertex array
     *   @param obj.weighted whether to weight the normal averages by incident face area
     *   @return an OBJ with obj.vertices and obj.normals
     */
    args = $.extend({
        weighted: false
    }, args);

    let face_map = {
        data: {},

        insert_face_normal: function(i0, i1, i2, obj) {
            let insert = function(that, index, obj) {
                if (that.data[index] === undefined)
                    that.data[index] = [];
                that.data[index].push(obj);
            };
            insert(this, i0, obj);
            insert(this, i1, obj);
            insert(this, i2, obj);
        },

        lookup_incident_normals: function(i0) {
            return this.data[i0];
        },
    };

    let count = obj.indices.length;
    for (let i = 0; i < count / 3; i++) {
        let i0 = obj.indices[3 * i + 0];
        let i1 = obj.indices[3 * i + 1];
        let i2 = obj.indices[3 * i + 2];

        let v0 = obj.vertices[i0];
        let v1 = obj.vertices[i1];
        let v2 = obj.vertices[i2];

        let normal = v2.sub(v0).cross(v1.sub(v0));
        if (! args.weighted)
            normal = normal.unit();

        face_map.insert_face_normal(i0, i1, i2, normal);
    }

    let vertices = [];
    let normals  = [];
    for (let i = 0; i < count; i++) {
        let i0 = obj.indices[i];
        let v0 = obj.vertices[i0];

        let normal       = new Vector(0, 0, 0);
        let face_normals = face_map.lookup_incident_normals(i0);
        for (let j = 0; j < face_normals.length; j++)
            normal = normal.add(face_normals[j]);

        normal   = normal.unit();
        normal.w = 0;

        vertices.push(v0);
        normals.push(normal);
    }

    return {vertices: vertices, normals: normals};
}

function normalize_obj_flat(obj) {
    /**  Make a Vertices+Normals OBJ from a Indices+Vertices OBJ
     *   @param obj.indices the index array
     *   @param obj.vertices the vertex array
     *   @return an OBJ with obj.vertices and obj.normals
     */
    let count    = obj.indices.length;
    let vertices = [];
    let normals  = [];
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
    return {vertices: vertices, normals: normals};
}


function render_normal(gl, obj) {
    let vert = `#version 100
        attribute vec4 a_Position;
        attribute vec4 a_Normal;

        uniform mat4 u_Model;
        uniform mat4 u_View;
        uniform mat4 u_Projection;

        varying vec4 v_Normal;

        void main(void)
        {
            v_Normal    = u_View * u_Model * a_Normal;
            gl_Position = u_Projection * u_View * u_Model * a_Position;
        }`;

    let frag = `#version 100
        precision mediump float;

        varying vec4 v_Normal;

        void main(void)
        {
            gl_FragColor = vec4(v_Normal.xyz, 1.0);
        }    
    `;

    INIT_SHADERS(gl, vert, frag)

    GET_ATTRIBUTE(a_Position, gl, 'a_Position')
    GET_ATTRIBUTE(a_Normal,   gl, 'a_Normal')

    GET_UNIFORM(u_Model,      gl, 'u_Model')
    GET_UNIFORM(u_View,       gl, 'u_View')
    GET_UNIFORM(u_Projection, gl, 'u_Projection')

    gl.uniformMatrix4fv(u_Model, false, obj.model.flatten());
    gl.uniformMatrix4fv(u_View, false, obj.view.flatten());
    gl.uniformMatrix4fv(u_Projection, false, obj.projection.flatten());

    let count = obj.indices.length;
    obj       = normalize_obj_average(obj);

    let vertices = Vector.flatten(obj.vertices);
    let normals  = Vector.flatten(obj.normals);

    let buffer = {
        vertices: gl.createBuffer(),
        normals:  gl.createBuffer()
    };
    if (! buffer.vertices || ! buffer.normals) {
        console.log('Failed to create the buffer objects');
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STREAM_DRAW);
    gl.vertexAttribPointer(a_Normal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, count);

    gl.disableVertexAttribArray(a_Normal);
    gl.disableVertexAttribArray(a_Position);
    gl.deleteBuffer(buffer.normals);
    gl.deleteBuffer(buffer.vertices);
}

function render_depth(gl, obj, rangeStart, rangeDepth) {
    let color = obj.color !== undefined ? obj.color : WHITE.copy();

    let vert = `#version 100
        attribute vec4 a_Position;

        uniform mat4 u_Model;
        uniform mat4 u_View;
        uniform mat4 u_Projection;

        varying float v_Depth;

        void main(void)
        {
            vec4 position = u_View * u_Model * a_Position;
            v_Depth       = -position.z;
            gl_Position   = u_Projection * position;
        }`;

    let frag = `#version 100
        precision mediump float;

        uniform vec3  u_Color;

        uniform float u_RangeStart;
        uniform float u_RangeDepth;

        varying float v_Depth;

        void main(void)
        {
            float colorScale = (v_Depth - u_RangeStart) / u_RangeDepth;
            colorScale       = 1.0 - max(0.0, min(colorScale, 1.0));
            gl_FragColor     = vec4(colorScale * u_Color, 1.0);
        }    
    `;

    INIT_SHADERS(gl, vert, frag)

    GET_ATTRIBUTE(a_Position, gl, 'a_Position')

    GET_UNIFORM(u_Model,      gl, 'u_Model')
    GET_UNIFORM(u_View,       gl, 'u_View')
    GET_UNIFORM(u_Projection, gl, 'u_Projection')

    GET_UNIFORM(u_Color,      gl, 'u_Color')

    GET_UNIFORM(u_RangeStart, gl, 'u_RangeStart')
    GET_UNIFORM(u_RangeDepth, gl, 'u_RangeDepth')

    gl.uniformMatrix4fv(u_Model, false, obj.model.flatten());
    gl.uniformMatrix4fv(u_View, false, obj.view.flatten());
    gl.uniformMatrix4fv(u_Projection, false, obj.projection.flatten());

    gl.uniform3f(u_Color, color.r, color.g, color.b);

    gl.uniform1f(u_RangeStart, rangeStart);
    gl.uniform1f(u_RangeDepth, rangeDepth);

    let indices  = new Uint16Array(obj.indices);
    let count    = indices.length;
    let vertices = Vector.flatten(obj.vertices);

    let buffer = {
        indices:  gl.createBuffer(),
        vertices: gl.createBuffer()
    };
    if (! buffer.indices || ! buffer.vertices) {
        console.log('Failed to create the buffer objects');
        return;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);

    gl.disableVertexAttribArray(a_Position);
    gl.deleteBuffer(buffer.normals);
    gl.deleteBuffer(buffer.vertices);
}

function render_edge(gl, obj) {
    let color = obj.color !== undefined ? obj.color : WHITE.copy();

    let vert = `#version 100
        attribute vec4 a_Position;
        attribute vec4 a_Normal;

        uniform mat4 u_Model;
        uniform mat4 u_View;
        uniform mat4 u_Projection;

        varying vec4 v_Position;
        varying vec4 v_Normal;

        void main(void)
        {
            v_Position  = u_View * u_Model * a_Position;
            v_Normal    = u_View * u_Model * a_Normal;
            gl_Position = u_Projection * v_Position;
        }`;

    let frag = `#version 100
        precision mediump float;

        uniform vec3 u_Color;

        varying vec4 v_Position;
        varying vec4 v_Normal;

        void main(void)
        {
            float edgeFactor = dot(normalize(-v_Position.xyz), v_Normal.xyz);
            edgeFactor       = 1.0 - max(0.0, min(edgeFactor, 1.0));
            gl_FragColor     = vec4(edgeFactor * u_Color, 1.0);
        }    
    `;

    INIT_SHADERS(gl, vert, frag)

    GET_ATTRIBUTE(a_Position, gl, 'a_Position')
    GET_ATTRIBUTE(a_Normal,   gl, 'a_Normal')

    GET_UNIFORM(u_Model,      gl, 'u_Model')
    GET_UNIFORM(u_View,       gl, 'u_View')
    GET_UNIFORM(u_Projection, gl, 'u_Projection')

    GET_UNIFORM(u_Color, gl, 'u_Color')

    gl.uniformMatrix4fv(u_Model, false, obj.model.flatten());
    gl.uniformMatrix4fv(u_View, false, obj.view.flatten());
    gl.uniformMatrix4fv(u_Projection, false, obj.projection.flatten());

    gl.uniform3f(u_Color, color.r, color.g, color.b);

    let count = obj.indices.length;
    obj       = normalize_obj_average(obj);

    let vertices = Vector.flatten(obj.vertices);
    let normals  = Vector.flatten(obj.normals);

    let buffer = {
        vertices: gl.createBuffer(),
        normals:  gl.createBuffer()
    };
    if (! buffer.vertices || ! buffer.normals) {
        console.log('Failed to create the buffer objects');
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STREAM_DRAW);
    gl.vertexAttribPointer(a_Normal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, count);

    gl.disableVertexAttribArray(a_Normal);
    gl.disableVertexAttribArray(a_Position);
    gl.deleteBuffer(buffer.normals);
    gl.deleteBuffer(buffer.vertices);
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

    let buffer = flattenF32(3, vertices);
    let count  = vertices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(mode, 0, count);

    gl.disableVertexAttribArray(a_Position);
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

    let buffer = flattenF32(3, vertices);
    let count  = vertices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.POINTS, 0, count);

    gl.disableVertexAttribArray(a_Position);
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
