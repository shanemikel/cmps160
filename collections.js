#pragma once

#include "shapes.js"


let PolylineList = function(color) {
    this.count   = 0;
    this.data    = [];
    this.current = new Polyline(color);
};

PolylineList.prototype = {
    insert: function(polyline) {
        let i = 0;
        for (; i < this.data.length; i++) {
            if (this.data[i] === undefined)
                break;
        }

        this.data[i] = polyline;
        this.count  += 1;
        return i;
    },
    makeNew: function(color) {
        let i = this.insert(this.current);
        this.current = new Polyline(color);
        return i;
    },

    at: function(i) {
        return this.data[i];
    },
    map: function(cb) {
        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] !== undefined)
                cb(i, this.data[i]);
    },
    remove: function(i) {
        this.data[i] = undefined;
        this.count -= 1;
    },
};


let CylinderList = function() {
    this.count = 0;
    this.data  = [];
};

CylinderList.prototype = {
    insert: function(cylinder) {
        let i = 0;
        for (; i < this.data.length; i++) {
            if (this.data[i] === undefined)
                break;
        }

        this.data[i] = cylinder;
        this.count  += 1;
        return i;
    },

    at: function(i) {
        return this.data[i];
    },
    map: function(cb) {
        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] !== undefined)
                cb(i, this.data[i]);
    },

    remove: function(i) {
        this.data[i] = undefined;
        this.count  -= 1;
    },
};
