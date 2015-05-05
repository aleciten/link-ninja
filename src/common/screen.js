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
    var screen = {
        toAbsolute:  function(e) {
            var doc  = (e.target instanceof HTMLDocument) ? e.target : e.target.ownerDocument,
                newX = e.clientX + doc.defaultView.pageXOffset,
                newY = e.clientY + doc.defaultView.pageYOffset;

            return { x: newX, y: newY };
        },

        distance: function(p1, p2) {
            var dx = Math.abs(p1.x - p2.x);
            var dy = Math.abs(p1.y - p2.y);

            return Math.sqrt(dx * dx + dy * dy);
        },

        // Check if a URL is correctly formed
        isValidUrl: function (url) {
            var urlRegex = /:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
            if (url.endsWith("/#")) return false;
            return urlRegex.test(url);
        },

        isElementInViewport: function (elem, bb) {
            var document = elem.ownerDocument,
                window   = document.defaultView,
                rect     = bb||el.getBoundingClientRect();

            return (
                rect.top    >= 0 &&
                rect.left   >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right  <= (window.innerWidth  || document.documentElement.clientWidth)
            );
        },  

        getDocumentDimensions: function(D) {
            var cs = D.defaultView.getComputedStyle(D.body);
            var parseProp = function(prop) {
                return parseFloat(/([\d\.]+)px/.exec(prop)[1]);
            };

            /*return {
                h: D.body.offsetHeight+parseProp(cs.marginTop)+parseProp(cs.marginBottom),
                w: D.body.offsetWidth+parseProp(cs.marginLeft)+parseProp(cs.marginRight)
            };*/
            return {
                h: Math.max(
                   Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
                   Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
                   Math.max(D.body.clientHeight, D.documentElement.clientHeight),
                   D.body.offsetHeight+parseProp(cs.marginTop)+parseProp(cs.marginBottom)
                ),
                w: D.body.offsetWidth+parseProp(cs.marginLeft)+parseProp(cs.marginRight)
            };
        }
    };

    // Exports
    ns.screen = screen;
})(aleciten.linkNinja);