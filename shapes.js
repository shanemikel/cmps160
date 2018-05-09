#pragma once

#include "util.js"


#define ORIGIN (new Vector(0.0, 0.0, 0.0))

let Polyline = function(color) {
    this.color  = color ? color.copy() : WHITE.copy();
    this.points = [];
};

Polyline.prototype = {
    addPoint: function(x, y) {
        this.points.push(new Vector(x, y, 0.0));
    },
    getPoints: function(mouseXY) {
        let res = [];

        for (let i = 0; i < this.points.length; i++)
            res.push(this.points[i].copy());

        if (mouseXY !== undefined)
            res.push(new Vector(mouseXY[0], mouseXY[1], 0.0));

        return res;
    },

    setColor: function(color) {
        this.color = color.copy();
    },
    getColor: function() {
        return this.color.copy();
    },
};


let Polylines = function(color) {
    this.count   = 0;
    this.lines   = [];
    this.current = new Polyline(color);
};

Polylines.prototype = {
    insert: function(polyline) {
        let i = 0;
        for (; i < this.lines.length; i++) {
            if (this.lines[i] === undefined)
                break;
        }

        this.lines[i] = polyline;
        this.count += 1;
        return i;
    },
    makeNew: function(color) {
        let i = this.insert(this.current);
        this.current = new Polyline(color);
        return i;
    },

    at: function(i) {
        return this.lines[i];
    },
    map: function(cb) {
        for (let i = 0; i < this.lines.length; i++)
            if (this.lines[i] !== undefined)
                cb(i, this.lines[i]);
    },
    remove: function(i) {
        this.lines[i] = undefined;
        this.count -= 1;
    },
};


let Circle = function(center, radius) {
    this.center = center.copy();
    this.radius = radius;
};

Circle.prototype = {
    getCenter: function() {
        return this.center.copy();
    },
    setCenter: function(center) {
        this.center = center.copy();
    },

    getRadius: function() {
        return this.radius;
    },
    setRadius: function(radius) {
        this.radius = radius;
    },

    toPolygon: function(sides) {
        let sliceAngle = 2 * Math.PI / sides;

        let res = [];
        for (let i = 0; i < sides; i++) {
            let x, y;
            if (sides % 2 == 0) {  // 'sides' is even
                x = this.radius * Math.cos(i * sliceAngle);
                y = this.radius * Math.sin(i * sliceAngle);
            } else {
                y = this.radius * Math.cos(i * sliceAngle);
                x = this.radius * Math.sin(i * sliceAngle);
            }
            res[i] = new Vector(
                this.center.x + x, this.center.y + y, this.center.z
            );
        }
        return res;
    },

    toFrame: function(sides) {
        let obj = {
            vertices: [this.center.copy()].concat(this.toPolygon(sides)),
            indices:  [],
        };
        for (let i = 1; i < obj.vertices.length; i++) {
            let i2 = i + 1;
            if (i2 == obj.vertices.length)
                i2 = 1;
            obj.indices.push(0.0);
            obj.indices.push(i);
            obj.indices.push(i);
            obj.indices.push(i2);
        }
        return obj;
    },

    toTrigs: function(sides) {
        let obj = {
            vertices: [this.center.copy()].concat(this.toPolygon(sides)),
            indices:  [],
        };
        for (let i = 1; i < obj.vertices.length; i++) {
            let i2 = i + 1;
            if (i2 == obj.vertices.length)
                i2 = 1;
            obj.indices.push(0);
            obj.indices.push(i);
            obj.indices.push(i2);
        }
        return obj;
    },
};

let Cylinder = function(end1, end2, radius, color) {
    this.end1   = end1.copy();
    this.end2   = end2.copy();
    this.radius = radius;

    if (color !== undefined)
        this.color = color.copy();
    else
        this.color = WHITE.copy();
};

Cylinder.prototype = {
    getColor: function() {
        return this.color.copy();
    },
    setColor: function(color) {
        this.color = color.copy();
    },

    getRadius: function() {
        return this.radius;
    },
    setRadius: function(radius) {
        this.radius = radius;
    },

    bridgeFrameIndices: function(sides) {
        let indices = [];
        for (let i = 1; i < sides + 1; i++) {
            let i2 = i + 1;
            if (i2 == sides + 1)
                i2 = 1;
            indices.push({end: 1, index: i});
            indices.push({end: 2, index: i});
            indices.push({end: 2, index: i});
            indices.push({end: 1, index: i2});
        }
        return indices;
    },

    bridgeTrigsIndices: function(sides) {
        let indices = [];
        for (let i = 1; i < sides + 1; i++) {
            let i2 = i + 1;
            if (i2 == sides + 1)
                i2 = 1;
            indices.push({end: 1, index: i});
            indices.push({end: 2, index: i});
            indices.push({end: 1, index: i2});
            indices.push({end: 2, index: i});
            indices.push({end: 1, index: i2});
            indices.push({end: 2, index: i2});
        }
        return indices;
    },

    toObj: function(circleObjFn, bridgeIndicesFn, sides) {
        let obj = {
            vertices: [],
            indices:  []
        };

        let c1_obj   = new Circle(this.end1, this.radius)[circleObjFn](sides);
        let c2_obj   = new Circle(this.end2, this.radius)[circleObjFn](sides);
        let c1_start = 0;
        let c2_start = c1_obj.vertices.length;

        obj.indices = obj.indices.concat(c1_obj.indices);
        obj.indices = obj.indices.concat(c2_obj.indices.map(i => i + c2_start));
        {
            let indices  = this[bridgeIndicesFn](sides).map(function(i) {
                switch (i.end) {
                case 1:
                    return i.index + c1_start;
                    break;
                case 2:
                    return i.index + c2_start;
                    break;
                }
            });
            obj.indices = obj.indices.concat(indices);
        }

        let m_rot;
        {
            var dir = this.end2.sub(this.end1).unit();
            m_rot   = new Matrix();
            m_rot   = m_rot.rotateY(Radians.fromDegrees(90));
            m_rot   = m_rot.rotateZ(-Math.atan(dir.y / dir.x));
        }

        {
            let xform1      = v => m_rot.translate(this.end1).multiply(v);
            let c1_vertices = c1_obj.vertices.map(xform1);
            let xform2      = v => m_rot.translate(this.end2).multiply(v);
            let c2_vertices = c2_obj.vertices.map(xform2);

            obj.vertices = obj.vertices.concat(c1_vertices);
            obj.vertices = obj.vertices.concat(c2_vertices);
        }
        return obj;
    },

    toFrame: function(sides) {
        return this.toObj('toFrame', 'bridgeFrameIndices', sides);
    },

    toTrigs: function(sides) {
        return this.toObj('toTrigs', 'bridgeTrigsIndices', sides);
    },
};

let Cylinders = function() {
    this.count     = 0;
    this.cylinders = [];
};

Cylinders.prototype = {
    insert: function(cylinder) {
        let i = 0;
        for (; i < this.cylinders.length; i++) {
            if (this.cylinders[i] === undefined)
                break;
        }

        this.cylinders[i]  = cylinder;
        this.count        += 1;
        return i;
    },

    at: function(i) {
        return this.cylinders[i];
    },
    map: function(cb) {
        for (let i = 0; i < this.cylinders.length; i++)
            if (this.cylinders[i] !== undefined)
                cb(i, this.cylinders[i]);
    },

    remove: function(i) {
        this.cylinders[i]  = undefined;
        this.count        -= 1;
    },
};


let Vector = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
};

Vector.prototype = {
    magnitude: function() {
        return Math.sqrt(
            Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2)
        );
    },
    unit: function() {
        /**  @return the unit-vector with direction of this
         */
        let len = this.magnitude();
        return new Vector(this.x / len, this.y / len, this.z / len);
    },

    scale: function(scalar) {
        /**  @param scalar a Number to scale this Vector by
         *   @return a Vector
         */
        return new Vector(scalar * this.x, scalar * this.y, scalar * this.z);
    },

    add: function(that) {
        /**  @param that another Vector to add to this
         *   @return a Vector
         */
        return new Vector(this.x + that.x, this.y + that.y, this.z + that.z);
    },

    sub: function(that) {
        /**  @param that another Vector to subtract from this (RHS)
         *   @return a Vector
         */
        return new Vector(this.x - that.x, this.y - that.y, this.z - that.z);
    },

    dot: function(that) {
        /**  @param that another Vector to dot with this
         *   @return a Number
         */
        return this.x * that.x + this.y * that.y + this.z * that.z;
    },

    cross: function(that) {
        /**  @param that another Vector to cross this with (RHS)
         *   @return a Vector
         */
        return new Vector(
            this.y * that.z - this.z * that.y,
            this.z * that.x - this.x * that.z,
            this.x * that.y - this.y * that.x
        );
    },

    toList: function() {
        return [this.x, this.y, this.z];
    },

    copy: function() {
        return new Vector(this.x, this.y, this.z);
    },
};

Vector.flatten = function(arr) {
    /**  @param arr an Array of Vectors
     *   @return a Float32Array (with length: 3 * arr.length)
     */
    let res = new Float32Array(arr.length * 3);
    for (let i = 0; i < arr.length; i++) {
        res[3 * i + 0] = arr[i].x;
        res[3 * i + 1] = arr[i].y;
        res[3 * i + 2] = arr[i].z;
    }
    return res;
};


let Matrix = function() {
    /**  Construct a 4x4 identity matrix stored as a row-major Float32Array
     */
    this.data = new Float32Array(4 * 4);
    for (let i = 0; i < 4; i++)
        this.data[4 * i + i] = 1;
};

Matrix.prototype = {
    scale: function(scalar) {
        /**  @param scalar a Number
         *   @return a Matrix
         */
        let mat = new Matrix();
        for (let i = 0; i < 3; i++)
            mat.data[4 * i + i] = scalar;

        return mat.multiply(this);
    },

    translate: function(vector) {
        /**  @param vector a Vector
         *   @return a Matrix
         */
        let mat = new Matrix();
        mat.data[4 * 0 + 3] = vector.x;
        mat.data[4 * 1 + 3] = vector.y;
        mat.data[4 * 2 + 3] = vector.z;

        return mat.multiply(this);
    },

    rotateX: function(radians) {
        /**  @param radians the angle (in radians) to rotate around the X axis
         *   @return a rotation Matrix
         */
        let mat = new Matrix();
        let row = 0;
        mat.data[4 * row + 0] = 1;
        mat.data[4 * row + 1] = 0;
        mat.data[4 * row + 2] = 0;
        row = 1;
        mat.data[4 * row + 0] = 0;
        mat.data[4 * row + 1] = Math.cos(radians);
        mat.data[4 * row + 2] = Math.sin(radians);
        row = 2;
        mat.data[4 * row + 0] = 0;
        mat.data[4 * row + 1] = -Math.sin(radians);
        mat.data[4 * row + 2] = Math.cos(radians);
        return mat.multiply(this);
    },

    rotateY: function(radians) {
        /**  @param radians the angle (in radians) to rotate around the Y axis
         *   @return a rotation Matrix
         */
        var mat = new Matrix();
        var row = 0;
        mat.data[4 * row + 0] = Math.cos(radians);
        mat.data[4 * row + 1] = 0;
        mat.data[4 * row + 2] = -Math.sin(radians);
        row = 1;
        mat.data[4 * row + 0] = 0;
        mat.data[4 * row + 1] = 1;
        mat.data[4 * row + 2] = 0;
        row = 2;
        mat.data[4 * row + 0] = Math.sin(radians);
        mat.data[4 * row + 1] = 0;
        mat.data[4 * row + 2] = Math.cos(radians);
        return mat.multiply(this);
    },

    rotateZ: function(radians) {
        /**  @param radians the angle (in radians) to rotate around the Z axis
         *   @return a rotation Matrix
         */
        var mat = new Matrix();
        var row = 0;
        mat.data[4 * row + 0] = Math.cos(radians);
        mat.data[4 * row + 1] = Math.sin(radians);
        mat.data[4 * row + 2] = 0;
        row = 1;
        mat.data[4 * row + 0] = -Math.sin(radians);
        mat.data[4 * row + 1] = Math.cos(radians);
        mat.data[4 * row + 2] = 0;
        row = 2;
        mat.data[4 * row + 0] = 0;
        mat.data[4 * row + 1] = 0;
        mat.data[4 * row + 2] = 1;
        return mat.multiply(this);
    },

    multiply: function(other) {
        /**  Multiply a Matrix by a Vector or another Matrix
         *   @param other either a Matrix or Vector
         *   @return either a Matrix or a Vector 
         */
        if (other.data === undefined) {  // other is a Vector
            other = [other.x, other.y, other.z, 1.0];
            var res = [0.0, 0.0, 0.0, 0.0];

            for (var i = 0; i < 4; i++) {
                for (var k = 0; k < 4; k++) {
                    var lhs  = this.data[4 * i + k];
                    res[i]  += lhs * other[k];
                }
            }

            for (var i = 0; i < 3; i++)
                res[i] /= res[3];
            return new Vector(res[0], res[1], res[2]);

        } else {                         // other is a Matrix
            var res  = new Matrix();
            res.data = new Float32Array(4 * 4);

            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    for (var k = 0; k < 4; k++) {
                        var lhs =  this.data[4 * i + k];
                        var rhs = other.data[4 * k + j];
                        res.data[4 * i + j] += lhs * rhs;
                    }
                }
            }
            return res;
        }
    },
};

Matrix.perspective = function() {
};


let Radians = {
    fromDegrees: function(degrees) {
        return degrees * Math.PI / 180;
    },
};


let RGBColor = function(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
};

RGBColor.prototype = {
    toList: function() {
        return [this.r, this.g, this.b];
    },

    copy: function() {
        return new RGBColor(this.r, this.g, this.b);
    },
};

RGBColor.fromHex = function(hex) {
    /**  Converts a hexadecimal color to an RGBColor
     *   @param hex a hexadecimal color value as a string of the form '#rrggbb'
     *   @return an RGBColor
     *   
     */
    // 'hexToRgb' function copied from 'https://stackoverflow.com/questions/5623838'
    let hexToRgb = function(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    let rgb = hexToRgb(hex.trim());
    rgb = new RGBColor(rgb.r / 255, rgb.g / 255, rgb.b / 255);
    return rgb;
};
