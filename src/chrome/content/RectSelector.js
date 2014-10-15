(function (ns) {
    var _      = ns._,
        SVG    = ns.SVG,
        screen = ns.screen,
        prefs  = ns.prefs;

    var RectSelector = function (args) {
        this.document         = args.document;
        this.window           = this.document.defaultView;
        this.canvas           = args.canvas;
        this.origin           = args.origin;
        this.selectables      = args.selectables||[];
        this.selection        = [];
        this.hitCount         = 0;
        this.chunkSize        = prefs.selector.findHitsChunkSize();
        this.selectionChanged = args.selectionChanged;

        this.mouse = { 
            x: this.origin.x, 
            y: this.origin.y 
        };

        this.rectBounds = { 
            top:    this.origin.y, 
            right:  this.origin.x, 
            bottom: this.origin.y, 
            left:   this.origin.x 
        };

        this.setupUI();
    };
    _.extend(RectSelector.prototype, {
        // Clean up DOM references
        dispose: function () {
            this.detach();
            this.document = null;
            this.window = null;
            this.selectables = null;
            this.canvas = null;
        },    

        start: function () {
            this.moveEventHandler = this.handleMouseMove.bind(this);
            this.window.addEventListener("mousemove", this.moveEventHandler, true);
            this.startTimers();
        },

        stop: function () {
            if (this.moveEventHandler) {
                this.window.removeEventListener("mousemove", this.moveEventHandler, true);
                this.moveEventHandler = null;
            }

            this.stopTimers();
        },
        
        findHits: function (x,y) {
            var self = this;

            if (!self.selectables || self.selectables.length < 1) return;
            if (self.findHitsRunning) return;
            
            self.findHitsRunning = true;
            var rb        = self.rectBounds;
            var c         = self.canvas;
            var chunks    = _.chunkize(self.selectables, this.chunkSize);
            var selection = [];

            var processStart = (new Date()).getTime();
            var processChunk = function (chunk, signalEnd) {                
                try {
                    _(chunk).each(function (s) {
                        var sb = s.getBBox();
                        if (!sb || sb.width <= 0 || sb.height <= 0) return false;

                        if (self.intersects(rb, sb)) {
                            selection.push(s);
                        }
                        else {
                            s.reset();
                        }
                    });
                }
                finally {
                    var nextChunk = chunks.shift();
                    if (nextChunk) {
                        _.defer(processChunk, nextChunk, signalEnd);
                    }
                    else {
                        signalEnd();
                    }
                }
            };
        
            _.defer(processChunk, chunks.shift(), function () {
                var hitCount = self.selectionChanged(selection);                
                self.findHitsRunning = false;

                if (self.hitCount != hitCount) {
                    self.selectorLabelText.setText(hitCount+" links");
                    self.updateLabelBox();
                    self.hitCount = hitCount;
                }
            });
        },

        hide: function () {
            this.selectorGroup.hide();
        },

        detach: function () {
            if (this.selectorGroup)
                this.selectorGroup.detach();
        },

        normalizeRect: function (r) {
            return {
                top:    r.y,
                right:  r.x + r.width,
                bottom: r.y + r.height,
                left:   r.x
            };
        },

        intersects: function (r1,r2) {
            return !(r2.left   > r1.right  ||
                     r2.right  < r1.left   ||
                     r2.top    > r1.bottom ||
                     r2.bottom < r1.top);
        },

        setSelectables: function (selectables) {
            this.selectables = selectables;
        },
    
        // Update label box domensions
        updateLabelBox: function () {
            var bb = this.selectorLabelText.getBBox();
            if (!bb) return;

            this.labelWidth = bb.width+this.labelRectPad;
            this.labelHeight = bb.height+this.labelRectPad;
            this.selectorLabelRect.size(bb.width + this.labelRectPad, bb.height + this.labelRectPad);
        },

        // Update rect dimensions and infobox anchoring 
        updateInterface: function () {
            var cp               = this.mouse,
                o                = this.origin,
                sr               = this.selectorRect,
                lr               = this.selectorLabelRect,
                lt               = this.selectorLabelText,
                isTop            = true,
                isLeft           = true,
                textAnchor       = "bottom",
                dominantBaseline = "text-before-edge";

            var sx = 0, sy = 0,
                lx = 0, ly = 0,
                sw = 0, sh = 0,
                ltpx = this.labelTextPad,
                ltpy = this.labelTextPad;

            if (cp.x < o.x)  {
                isLeft = true;

                sx = cp.x;
                sw = o.x - cp.x;
                lx = cp.x + 3;

                ltpx = this.labelTextPad + 2;
                textAnchor = "start";
            }
            else {
                isLeft = false;

                sx =  o.x;
                sw = cp.x - o.x;
                lx = cp.x - this.labelWidth - 4;

                ltpx = -this.labelTextPad - 2;
                textAnchor = "end";
            }

            if (cp.y < o.y) {
                isTop = true;

                sy = cp.y;
                sh = o.y - cp.y;
                ly = cp.y + 3;

                ltpy = this.labelTextPad + 1;
                dominantBaseline = "text-before-edge";
            }
            else {
                isTop = false;

                sy = o.y;
                sh = cp.y - o.y;
                ly = cp.y - this.labelHeight - 4;

                ltpy = -this.labelTextPad-2;
                dominantBaseline = "text-after-edge";
            }

            // clear the cursor
            if (isTop && isLeft) {
                lx   += 8; ly   += 15;
                ltpx += 8; ltpy += 15;
            }

            sr.pos(sx, sy).size(sw, sh);

            lt.pos(cp.x, cp.y)
              .attr({ "text-anchor": textAnchor, "dominant-baseline": dominantBaseline })
              .transform().translate(ltpx, ltpy);

            lr.pos(lx, ly);

            this.rectBounds = { top: sy, right: sx+sw, bottom: sy+sh, left: sx };
        },

        getLastPoint: function () {
            return _.extend({},this.mouse);
        },

        handleMouseMove: function (e) {           
            this.mouse = screen.toAbsolute(e);
            this.mouse.screenX = e.screenX;
            this.mouse.screenY = e.screenY;
        },

        startTimers: function () {
            this.stopTimers();

            this.findHitsTimer = this.window.setInterval(function () { 
                this.findHits(); 
            }.bind(this), 10);

            this.updateInterfaceTimer = this.window.setInterval(function () { 
                this.updateInterface(); 
            }.bind(this), 10);
        },

        stopTimers: function () {
            if (this.findHitsTimer) {
                this.window.clearInterval(this.findHitsTimer);
                this.findHitsTimer = null;
            }
            
            if (this.updateInterfaceTimer) {
                this.window.clearInterval(this.updateInterfaceTimer);
                this.updateInterfaceTimer = null;
            }
        },

        setupUI: function () {
            this.selectorGroup = this.canvas.group("rectSelector");

            var borderColor = prefs.selector.borderColor()||"#3399ff";
            var fillColor = prefs.selector.fillColor()||"#3399ff";
            var opacity = parseInt(prefs.selector.opacity()) / 100;

            this.selectorRect = this.selectorGroup
                .rect()
                .attr({
                    "stroke":           borderColor,
                    "fill":             fillColor,
                    "fill-opacity":     opacity,
                    "stroke-width":     1,
                    "stroke-dasharray": "5,2"
                })
                .pos(this.origin.x, this.origin.y);

            this.labelRectPad = 5;
            this.selectorLabelRect = this.selectorGroup
                .rect()
                .pos(this.origin.x, this.origin.y)
                .attr({
                    "fill":         "#cacaca",
                    "fill-opacity": 0.8
                });

            this.labelTextPad = 5;
            this.selectorLabelText = this.selectorGroup
                .text("0 links")
                .attr({
                    "fill":         "#000000",
                    "fill-opacity": 1,
                    "font-family":  "Calibri",
                    "font-size":    "12px"
                });

            this.updateLabelBox();
        }
    });

    // Exports
    ns.selectors = (typeof ns.selectors != "undefined") ? ns.selectors : {};
    ns.selectors.RectSelector = RectSelector;
})(aleciten.linkNinja);