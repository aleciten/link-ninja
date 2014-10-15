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