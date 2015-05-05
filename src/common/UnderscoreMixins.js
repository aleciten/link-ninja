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
    ns._ = _.noConflict();
    ns._.mixin({
        chunkize: function (arr, chunkSize) {       
            var arrLength = arr.length;
            var chunks = [];
            for (var chunkIndex=0; chunkIndex < arrLength / chunkSize; chunkIndex++) {
                chunks.push(arr.slice(chunkIndex*chunkSize, (chunkIndex+1)*chunkSize));             
            }
            return chunks;
        },

        matchesWildcard: function(testString, pattern) {
            var escapedRegEx = "^"+pattern
                .replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
                .replace(/\\\*/g, ".*?")+"$";
            var rx = new RegExp(escapedRegEx);
            return rx.test(testString);
        }
    });
})(aleciten.linkNinja);