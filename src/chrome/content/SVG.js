(function (ns) {
    var _     = ns._,
        svgns = 'http://www.w3.org/2000/svg',
        xmlns = 'http://www.w3.org/2000/xmlns/',
        xlink = 'http://www.w3.org/1999/xlink';

    var Base = {
        attr: function (args) {
            if (typeof(args) == "string") {
                return this.elem.getAttribute(args);
            }
            else {
                _(_.keys(args)).each(function (k) {
                  this.elem.setAttribute(k,args[k]);
              }.bind(this));
            }

            return this;
        },
        style: function (args) {
            if (typeof(args) == "string") {
                return this.elem.style[args];
            }
            else {
                _(_.keys(args)).each(function (k) {
                    this.elem.style[k] = args[k];
                }.bind(this));
            }

            return this;
        },
        attach: function (to) {
            if (to) this.container = to;
            this.container.appendChild(this.elem);
            return this;
        },
        detach: function () {
            if (this.elem.parentNode)
                this.elem.parentNode.removeChild(this.elem);
            return this;
        }
    };

    var Transforms = function () {
        var svgTransforms = ['translate', 'rotate', 'matrix'];

        this.activeTransforms = {};
        this.transforms = {};
        _(svgTransforms).each(function (t) {
            this.transforms[t] = function () {
                this.setTransform(t, Array.prototype.slice.call(arguments));
                return this;
            }.bind(this);
        }.bind(this));
    };
    _.extend(Transforms.prototype, {
        transform: function () {
            return this.transforms;
        },
        setTransform: function (t, v) {
            this.activeTransforms[t] = v;
            this.refreshTransforms();
        },
        refreshTransforms: function () {
            var t = this.activeTransforms;
            var text = _(_.keys(t))
                .map(function (k) { return k + "("+t[k].join()+")"; })
                .join(" ");

            this.elem.setAttribute("transform", text);
        }
    });

    var Shape = function (canvas, args) {
        Transforms.call(this);

        this.canvas = canvas;
        this.__create__();

        this.attr(_.extend({ name: "" }, args||{}));
    };
    _.extend(Shape.prototype, Base, Transforms.prototype, {
        __create__: function () {
            this.elem = this.canvas.__createElement__(this.svgType);
        },
        dispose: function () {
            this.detach();
            this.elem = null;
            this.canvas = null;
        },
        pos: function (x,y) {
            this.attr({ x: x, y: y });
            return this;
        },
        size: function (w,h) {
            this.attr({ width: w, height: h });
            return this;
        },
        moveBy: function (x,y) {
            this.pos(parseInt(this.attr("x")||0)+x, parseInt(this.attr("y")||0)+y);
            return this;
        },
        show: function () {
            this.attr({ visibility: "visible" });
            return this;
        },
        hide: function () {
            this.attr({ visibility: "hidden" });
            return this;
        },
        getBBox: function () {
            try {
                return this.elem.getBBox();
            }
            catch (ex) {
                return null;
            }
        },
        dim: function () {
            if (this.elem.parentNode)
                return this.elem.getBBox();
            return null;
        }
    });

    var ShapeCreator = function (document) {
        this.document = document;
        this.children = [];
    };
    _.extend(ShapeCreator.prototype, {
        __createElement__: function (type) {
            return this.document.createElementNS(svgns, type);
        },
        __createShape__: function (ctor, arg1, arg2) {
            var obj = new ctor(this, arg1, arg2);

            this.children.push(obj);
            this.elem.appendChild(obj.elem);

            return obj;
        },
        rect: function (w,h) {
            return this.__createShape__(Rect, { width: w||0, height: h||0 });
        },
        text: function (text) {
            return this.__createShape__(Text, { text: text||"" });
        },
        group: function (name) {
            var g = _(this.children).findWhere({ svgType: "g", name: name });
            return g||this.__createShape__(Group, { name: name });
        },        
        clear: function () {
            _(this.children).each(function (child) { 
                this.elem.removeChild(child.elem); 
            }.bind(this));
            this.children = [];

            return this;
        }
    });

    var SVG = function (container) {
        ShapeCreator.call(this, container.ownerDocument);
        Shape.call       (this, this);

        this.container = container;

        this.elem.style.position = "absolute";
        this.elem.style.left     = "0";
        this.elem.style.top      = "0";        
        this.elem.style.zIndex   = 9999999;
    };
    _.extend(SVG.prototype, Base, ShapeCreator.prototype, Shape.prototype, {
        svgType: "svg",
        dispose: function () {            
            this.elem      = null;
            this.document  = null;
            this.container = null;
        }
    });

    var Group = function (canvas, args) {
        ShapeCreator.call (this, canvas.document);
        Shape.call        (this, canvas);
        
        this.name = args.name;
    };
    _.extend(Group.prototype, ShapeCreator.prototype, Shape.prototype, {
        svgType: "g",        
        // Shape.pos override
        pos: function (x,y) {
            this.translate(x,y);
            return this;
        }
    });

    var Rect = function (owner, args) {
        var defaultArgs = {
            "stroke-linecap":  "butt",
            "stroke-linejoin": "bevel",
            "shape-rendering": "crispEdges"
        };

        Shape.call(this, owner, _.extend(defaultArgs, args));
    };
    _.extend(Rect.prototype, Shape.prototype, {
        svgType: "rect"
    });

    var Text = function (owner, args) {
        Shape.call(this, owner, {});
        this.setText(args.text);
    };
    _.extend(Text.prototype, Shape.prototype, {
        svgType: "text",        
        setText: function (text) {
            this.elem.textContent = text;
        }
    });

    // Exports
    ns.SVG = SVG;
})(aleciten.linkNinja);
