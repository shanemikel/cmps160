#pragma once

#include "util.js"


#define ORIGIN (new Vector(0.0, 0.0, 0.0))


var Vector = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
};

Vector.prototype = {
    toList: function() {
        return [this.x, this.y, this.z];
    },

    copy: function() {
        return new Vector(this.x, this.y, this.z);
    },
};

var RGBColor = function(r, g, b) {
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
    /**  Converts a hex format color (as a string), to an RGBColor
     *
     *   'hexToRgb' function copied from 'https://stackoverflow.com/questions/5623838'
     */
    var hexToRgb = function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    var rgb = hexToRgb(hex.trim());
    rgb = new RGBColor(rgb.r / 255, rgb.g / 255, rgb.b / 255);
    return rgb;
};


var Polyline = function(color) {
    this.color  = color ? color.copy() : WHITE.copy();
    this.points = [];
};

Polyline.prototype = {
    addPoint: function(x, y) {
        this.points.push(new Vector([x, y, 0.0]));
    },
    getPoints: function(mouseXY) {
        var res = [];

        for (var i = 0; i < this.points.length; i++)
            res.push(this.points[i].copy());

        if (mouseXY !== undefined)
            res.push(new Vector([mouseXY[0], mouseXY[1], 0.0]));

        return res;
    },

    setColor: function(color) {
        this.color = color.copy();
    },
    getColor: function() {
        return this.color.copy();
    },
};


var Polylines = function(color) {
    this.count   = 0;
    this.lines   = [];
    this.current = new Polyline(color);
};

Polylines.prototype = {
    insert: function(polyline) {
        var i = 0;
        for (; i < this.lines.length; i++) {
            if (this.lines[i] === undefined)
                break;
        }

        this.lines[i] = polyline;
        this.count += 1;
        return i;
    },
    makeNew: function(color) {
        var i = this.insert(this.current);
        this.current = new Polyline(color);
        return i;
    },

    at: function(i) {
        return this.lines[i];
    },
    map: function(cb) {
        for (var i = 0; i < this.lines.length; i++)
            if (this.lines[i] !== undefined)
                cb(i, this.lines[i]);
    },
    remove: function(i) {
        this.lines[i] = undefined;
        this.count -= 1;
    },
};


var Circle = function(center, radius) {
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
        var sliceAngle = 2 * Math.PI / sides;

        var res = [];
        for (var i = 0; i < sides; i++) {
            if (sides % 2 == 0) {  // 'sides' is even
                var x = this.radius * Math.cos(i * sliceAngle);
                var y = this.radius * Math.sin(i * sliceAngle);
            } else {
                var y = this.radius * Math.cos(i * sliceAngle);
                var x = this.radius * Math.sin(i * sliceAngle);
            }
            res[i] = new Vector(
                this.center.x + x, this.center.y + y, this.center.z
            );
        }
        return res;
    },

    toFrame: function(sides) {
        var res = {
            vertices: [this.center.copy()].concat(this.toPolygon(sides)),
            indices:  [],
        };
        for (var i = 1; i < res.vertices.length; i++) {
            var i2 = i + 1;
            if (i2 == res.vertices.length)
                i2 = 1;
            res.indices.push(0.0);
            res.indices.push(i);
            res.indices.push(i);
            res.indices.push(i2);
        }
        return res;
    },

    toTrigs: function(sides) {
        var res = {
            vertices: [this.center.copy()].concat(this.toPolygon(sides)),
            indices:  [],
        };
        for (var i = 1; i < res.vertices.length; i++) {
            var i2 = i + 1;
            if (i2 == res.vertices.length)
                i2 = 1;
            res.indices.push(0);
            res.indices.push(i);
            res.indices.push(i2);
        }
        return res;
    },
};

var Cylinder = function(end1, end2, color) {
    this.end1  = end1.copy();
    this.end2  = end2.copy();

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

    toFrame: function(sides, radius) {
        var deltaX = this.end2.x - this.end1.x;
        var deltaY = this.end2.y - this.end1.y;

        var c1 = new Circle(ORIGIN, radius);
        var c2 = new Circle(ORIGIN, radius);

        var rotate = (new Matrix()).rotateY(Math.PI / 2)
                                   .rotateZ(-Math.atan(deltaY / deltaX));
        var xform1 = rotate.translate(this.end1);
        var xform2 = rotate.translate(this.end2);

        var c1_vertices = c1.toFrame(sides).vertices
                            .map(v => xform1.multiply(v));
        var c2_vertices = c2.toFrame(sides).vertices
                            .map(v => xform2.multiply(v));

        var polygon1_vertices = c1.toPolygon(sides).map(v => xform1.multiply(v));
        var polygon2_vertices = c2.toPolygon(sides).map(v => xform2.multiply(v));
        
        var bridge = [];
        for (var i = 0; i < polygon1_vertices.length; i++) {
            var i2 = (i + 1) % polygon1_vertices.length;
            bridge.push(polygon1_vertices[i]);
            bridge.push(polygon2_vertices[i]);
            bridge.push(polygon2_vertices[i]);
            bridge.push(polygon1_vertices[i2]);
        }

        return c1_vertices.concat(c2_vertices).concat(bridge);
    },

    // toFrame: function(sides, radius) {
    //     var deltaX = this.end2.x - this.end1.x;
    //     var deltaY = this.end2.y - this.end1.y;

    //     var c1 = new Circle(ORIGIN, radius);
    //     var c2 = new Circle(ORIGIN, radius);

    //     var rotate = (new Matrix()).rotateY(Math.PI / 2)
    //                                .rotateZ(-Math.atan(deltaY / deltaX));
    //     var xform1 = rotate.translate(this.end1);
    //     var xform2 = rotate.translate(this.end2);

    //     var c1_vertices = c1.toFrame(sides).vertices
    //                         .map(v => xform1.multiply(v));
    //     var c2_vertices = c2.toFrame(sides).vertices
    //                         .map(v => xform2.multiply(v));

    //     var polygon1_vertices = c1.toPolygon(sides).map(v => xform1.multiply(v));
    //     var polygon2_vertices = c2.toPolygon(sides).map(v => xform2.multiply(v));
        
    //     var bridge = [];
    //     for (var i = 0; i < polygon1_vertices.length; i++) {
    //         var i2 = (i + 1) % polygon1_vertices.length;
    //         bridge.push(polygon1_vertices[i]);
    //         bridge.push(polygon2_vertices[i]);
    //         bridge.push(polygon2_vertices[i]);
    //         bridge.push(polygon1_vertices[i2]);
    //     }

    //     return c1_vertices.concat(c2_vertices).concat(bridge);
    // },

    toTrigs: function(sides, radius) {
        var deltaX = this.end2.x - this.end1.x;
        var deltaY = this.end2.y - this.end1.y;

        var c1 = new Circle(ORIGIN, radius);
        var c2 = new Circle(ORIGIN, radius);

        var rotate = (new Matrix()).rotateY(Math.PI / 2)
                                   .rotateZ(-Math.atan(deltaY / deltaX));
        var xform1 = rotate.translate(this.end1);
        var xform2 = rotate.translate(this.end2);

        var c1_vertices = c1.toTrigs(sides).map(v => xform1.multiply(v));
        var c2_vertices = c2.toTrigs(sides).map(v => xform2.multiply(v));;

        var polygon1_vertices = c1.toPolygon(sides).map(v => xform1.multiply(v));
        var polygon2_vertices = c2.toPolygon(sides).map(v => xform2.multiply(v));
        
        var bridge = [];
        for (var i = 0; i < polygon1_vertices.length; i++) {
            var i2 = (i + 1) % polygon1_vertices.length;
            bridge.push(polygon1_vertices[i]);
            bridge.push(polygon2_vertices[i]);
            bridge.push(polygon1_vertices[i2]);
            bridge.push(polygon2_vertices[i]);
            bridge.push(polygon1_vertices[i2]);
            bridge.push(polygon2_vertices[i2]);
        }

        return c1_vertices.concat(c2_vertices).concat(bridge);
    },

    // toTrigs: function(sides, radius) {
    //     var deltaX = this.end2.x - this.end1.x;
    //     var deltaY = this.end2.y - this.end1.y;

    //     var c1 = new Circle(ORIGIN, radius);
    //     var c2 = new Circle(ORIGIN, radius);

    //     var rotate = (new Matrix()).rotateY(Math.PI / 2)
    //                                .rotateZ(-Math.atan(deltaY / deltaX));
    //     var xform1 = rotate.translate(this.end1);
    //     var xform2 = rotate.translate(this.end2);

    //     var c1_vertices = c1.toTrigs(sides).map(v => xform1.multiply(v));
    //     var c2_vertices = c2.toTrigs(sides).map(v => xform2.multiply(v));;

    //     var polygon1_vertices = c1.toPolygon(sides).map(v => xform1.multiply(v));
    //     var polygon2_vertices = c2.toPolygon(sides).map(v => xform2.multiply(v));
        
    //     var bridge = [];
    //     for (var i = 0; i < polygon1_vertices.length; i++) {
    //         var i2 = (i + 1) % polygon1_vertices.length;
    //         bridge.push(polygon1_vertices[i]);
    //         bridge.push(polygon2_vertices[i]);
    //         bridge.push(polygon1_vertices[i2]);
    //         bridge.push(polygon2_vertices[i]);
    //         bridge.push(polygon1_vertices[i2]);
    //         bridge.push(polygon2_vertices[i2]);
    //     }

    //     return c1_vertices.concat(c2_vertices).concat(bridge);
    // },

    // normals: function(sides, radius) {
    //     var trigs = this.toTrigs(sides, radius);

    //     var res = [];
    //     for (var i = 0; i < trigs.length / 3; i++) {
    //         var trig0 = trigs[3 * i];
    //         var trig1 = trigs[3 * i + 1];
    //         var trig2 = trigs[3 * i + 2];

    //         var vec1 = vector_sub(trig1, trig0);
    //         var vec2 = vector_sub(trig2, trig0);

    //         var normal = normalize(cross_product(vec1, vec2));
    //         res.push(normal);
    //     }
    //     return res;
    // },
};

var Cylinders = function() {
    this.count     = 0;
    this.cylinders = [];
};

Cylinders.prototype = {
    insert: function(cylinder) {
        var i = 0;
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
        for (var i = 0; i < this.cylinders.length; i++)
            if (this.cylinders[i] !== undefined)
                cb(i, this.cylinders[i]);
    },

    remove: function(i) {
        this.cylinders[i]  = undefined;
        this.count        -= 1;
    },
};


var Matrix = function() {
    /**  Construct a 4x4 identity matrix stored as a row-major Float32Array
     */
    this.data = new Float32Array(4 * 4);
    for (var i = 0; i < 4; i++)
        this.data[4 * i + i] = 1;
};

Matrix.prototype = {
    scale: function(scalar) {
        var mat = new Matrix();
        for (var i = 0; i < 3; i++)
            mat.data[4 * i + i] = scalar;

        return mat.multiply(this);
    },

    translate: function(vector) {
        var mat = new Matrix();
        for (var i = 0; i < 3; i++)
            mat.data[4 * i + 3] = vector[i];

        return mat.multiply(this);
    },

    rotateX: function(radians) {
        var mat = new Matrix();
        var row = 0;
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
        /**  Multiply a 4x4 matrix by a 3-vector or another 4x4 Matrix
         *   @param other either a matrix or vector
         */
        if (other.data === undefined) {  // other is a 3-vector (as Array)
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
            return new Vector(res.x, res.y, res.z);

        } else {                         // other is a 4x4 matrix
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
