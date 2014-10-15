// This file is part of Link Ninja (http://github.com/aleciten/link-ninja)
//
// Copyright (C) 2014 Alejandro Becher
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

(function (ns) {
    var _     = ns._,
        prefs = ns.prefs;

    var Selectable = function (s) {
        this.canvas   = s.canvas;
        this.target   = s.target;
        this.document = this.target.ownerDocument;
        this.selected = false;
        this.rect     = null;
        this.bbox     = null;
        
        var fillColor = prefs.selectable.fillColor()||"#3399ff";
        var borderColor = prefs.selectable.borderColor()||"#3399ff";
        var opacity = parseInt(prefs.selectable.opacity()) / 100;

        this.rectAttributes = {
            "stroke":           borderColor,
            "fill":             fillColor,
            "stroke-width":     1,
            "fill-opacity":     opacity,
            "stroke-linecap":   "butt",
            "stroke-linejoin":  "bevel",
            "shape-rendering":  "crispEdges"
        };
    };
    _.extend(Selectable.prototype, {
        setupRect: function () {
            var bb = this.getBBox();

            this.rect = this.canvas
                .rect(bb.width, bb.height)
                .pos (bb.left,  bb.top)
                .attr(this.rectAttributes);
        },
        
        select: function () {
            if (this.selected) return;
            if (!this.rect) this.setupRect();

            this.rect.show();
            this.selected = true;
        },

        reset: function () {
            if (!this.selected || !this.rect) return;

            this.rect.hide();
            this.bbox = null;
            this.selected = false;
        },

        getFontSize: function () {
            if (this.fontSize === undefined) {
                var cs = this.document.defaultView.getComputedStyle(this.target);
                this.fontSize = cs.fontSize.substring(0, cs.fontSize.indexOf("px"));                
            }
            return this.fontSize;
        },

        getBBox: function () {
            if (this.bbox) return this.bbox;

            // hack to get corret dimensions when the anchor contains an image
            var target = (this.target.childNodes.length > 0 && this.target.childNodes[0].nodeName === "IMG") ? 
                this.target.childNodes[0] : this.target;

            var bcr = target.getBoundingClientRect(),
                st  = this.document.documentElement.scrollTop,
                sl  = this.document.documentElement.scrollLeft;

            this.bbox = {
                top:    bcr.top    + st,
                right:  bcr.right  + sl,
                bottom: bcr.bottom + st,
                left:   bcr.left   + sl,
                width:  bcr.width,
                height: bcr.height
            };
            return this.bbox;
        }
    });

    // Exports
    ns.Selectable = Selectable;
})(aleciten.linkNinja);