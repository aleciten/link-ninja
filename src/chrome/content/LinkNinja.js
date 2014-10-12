(function (ns) {
    var _              = ns._,
        browser        = ns.browser,
        screen         = ns.screen,
        prefs          = ns.prefs,
        targeting      = ns.targeting,
        SVG            = ns.SVG,
        Trigger        = ns.Trigger,
        TriggerHandler = ns.TriggerHandler,
        Selectable     = ns.Selectable;

    var LinkNinja = function (args) {
        this.document       = args.document;
        this.window         = args.document.defaultView;
        this.triggerHandler = null;
        this.canvas         = null;
        this.selector       = null;
        this.selectables    = [];

        this.triggerHandler = new TriggerHandler({ target: this.window });
        this.setupTriggers();

        this.window.addEventListener("unload", this.dispose.bind(this), false);
    };
    _.extend(LinkNinja.prototype, {     
        // Clean up DOM references      
        disposed: false,
        dispose: function () {
            this.document    = null;
            this.window      = null;
            this.selectables = null;

            if (this.selector) {             
                this.selector.dispose();
                this.selector = null;
            }

            if (this.canvas) {
                this.canvas.dispose();
                this.canvas = null;
            }

            if (this.triggerHandler) {              
                this.triggerHandler.dispose();
                this.triggerHandler = null;
            }
            
            this.disposed = true;           
        },

        reloadSettings: function () {
            this.stop();
            this.setupTriggers();
            this.start();
        },

        // Start listening for user events
        start: function () {
            this.triggerHandler.start(this.startTrigger);
        },

        // Stop listening for user events
        stop: function () {
            if (this.triggerHandler)
                this.triggerHandler.stopAll();          

            this.stopSelection();
        },
        
        // Configure user event triggers
        setupTriggers: function () {
            var th = this.triggerHandler;

            this.startTrigger      = null;
            this.stopTrigger       = null;
            this.cancelTrigger     = null;
            this.actionMenuTrigger = null;

            var cancelTriggerEnabled = prefs.cancelTrigger.enabled();
            var actionMenuTriggerEnabled = prefs.actionMenuTrigger.enabled();

            var getTriggerEventArgs = function (triggerPref) {
                if (triggerPref.type() == "mouse") {
                    return {
                        event: "mousedown",
                        eventArgs: { button: triggerPref.mouseButton() }
                    };
                }
                else {
                    return {
                        event: "keydown",
                        eventArgs: { keyCode: triggerPref.keyCode() }
                    };
                }
            };

            this.startTrigger = new Trigger({           
                name: "startSelection",
                event: "mousedown", 
                eventArgs: {
                    button:   prefs.startTrigger.mouseButton(), 
                    shiftKey: prefs.startTrigger.shiftKey(),
                    ctrlKey:  prefs.startTrigger.ctrlKey(),
                    altKey:   prefs.startTrigger.altKey()
                },
                action: function (e) {
                    th.start(this.stopTrigger);
                    if (cancelTriggerEnabled) {
                        th.start(this.cancelTrigger);
                    }
                    if (actionMenuTriggerEnabled) {
                        th.start(this.actionMenuTrigger);
                    }

                    var origin = screen.toAbsolute(e);
                    this.startSelection(origin);
                }.bind(this)
            });
            if (prefs.startTrigger.displacementRequired()) {
                this.startTrigger.displacement = prefs.startTrigger.displacement();
            }

            this.stopTrigger = new Trigger({
                name: "stopSelection",
                event: "mouseup", 
                eventArgs: {
                    button: prefs.startTrigger.mouseButton()
                },
                action: function (e) {
                    try {
                        th.stop(this.cancelTrigger);
                        th.stop(this.stopTrigger);
                        th.stop(this.actionMenuTrigger);

                        this.stopSelection();
                        var selectedAction = ns.actions[prefs.defaultAction()] || ns.actions.openTabs;
                        this.processSelection(selectedAction);
                    }
                    finally {                        
                        this.destroyCanvas();
                    }
                }.bind(this)
            });

            if (cancelTriggerEnabled) {
                let params = getTriggerEventArgs(prefs.cancelTrigger);                
                this.cancelTrigger = new Trigger({
                    name: "cancelSelection",
                    event: params.event, 
                    eventArgs: params.eventArgs,
                    action: function (e) {
                        try {
                            th.stop(this.stopTrigger);
                            th.stop(this.cancelTrigger);
                            th.stop(this.actionMenuTrigger);
                        }
                        finally {
                            this.destroySelector();
                            this.destroyCanvas();
                        }
                    }.bind(this)
                });     
            }

            if (actionMenuTriggerEnabled) {
                let params = getTriggerEventArgs(prefs.actionMenuTrigger);                
                this.actionMenuTrigger = new Trigger({         
                    name: "actionMenu",
                    event: params.event, 
                    eventArgs: params.eventArgs,
                    action: function (e) {
                        th.stop(this.stopTrigger);
                        th.stop(this.actionMenuTrigger);
                        th.stop(this.cancelTrigger);
                            
                        this.stopSelection();
                        
                        var pos = this.selector.getLastPoint();
                        var menu = new ns.ActionMenu({
                            selection: this.getSelection(),
                            callback: function (selectedAction) {
                                try {
                                    if (selectedAction) {
                                        this.processSelection(selectedAction);
                                    }
                                }
                                finally {
                                    this.destroySelector();
                                    this.destroyCanvas();
                                }
                            }.bind(this)
                        });
                        
                        menu.open(pos.screenX, pos.screenY);
                    }.bind(this)
                });
            }
        },

        // Setup currently configured selector (currently, the only available selector is RectSelector)
        setupSelector: function (origin) {
            this.destroySelector();
            if (!this.canvas) throw "No canvas";

            this.selector = new ns.selectors.RectSelector({
                document:          this.document,
                canvas:            this.canvas,                       
                origin:            origin,
                selectionChanged:  this.onSelectionChanged.bind(this)
            });
        },

        destroySelector: function () {
            if (this.selector) {
                this.selector.stop();
                this.selector.detach();
                this.selector.dispose();
                this.selector = null;
            }
        },

        setupCanvas: function () {                      
            this.destroyCanvas();

            var dd = screen.getDocumentDimensions(this.document);
            this.canvas = new SVG(this.document.body);
            this.canvas.size(dd.w, dd.h).attach();
        },

        destroyCanvas: function () {
            if (this.canvas) {
                this.canvas.detach();
                this.canvas.dispose();
                this.canvas = null;
            }
        },

        // Start current selector
        startSelection: function (origin) {
            this.setupCanvas();
            this.setupSelector(origin);
                                
            this.refreshSelectables(function (s) {
                this.selector.setSelectables(s);
                this.canvas.attach();
            }.bind(this));
            
            this.selector.start();
        },

        // Stop current selector & cleanup
        stopSelection: function () {
            if (this.selector) {
                this.selector.stop();
            }
        },

        getSelection: function () {
            var selectedLinks = _.chain(this.selectables)
                .filter(function (s) { return s.selected; })
                .map(function (s) { return s.target; })
                .value();
            return selectedLinks;
        },

        processSelection: function (action) {
            if (!action) return;
            var selection = this.getSelection();
            action.act(selection);
        },

        // The selector has updated the selection, decide which items are finally selected
        onSelectionChanged: function (selection) {
            var applyFontSizeRule = (this.appliedTargetingRules.length === 0);
            var hitCount = 0;
            
            if (applyFontSizeRule) {
                var maxFontSize = _(selection).reduce(function (memo, s) { 
                    var fs = s.getFontSize();
                    return (fs > memo) ? fs : memo;
                }, 0);

                _(selection).each(function(s) { 
                    if (s.getFontSize() === maxFontSize) {
                        s.select();
                        hitCount += 1;
                    }
                    else {
                        s.reset();
                    }
                });
            }
            else {
                _(selection).each(function(s) { 
                    s.select();
                    hitCount += 1;
                });
            }

            return hitCount;
        },

        // Refresh selectable anchors list
        refreshSelectables: function (callback) {
            this.selectables = [];
            
            var anchors = _(this.document.getElementsByTagName("a")).toArray();         
            if (anchors.length < 1) {               
                callback(self.selectables);
                return;
            }

            this.appliedTargetingRules = targeting.getRulesBoundToUrl(this.window.location.href);
            var canvas = this.canvas.group("selectables");

            var chunkSize = 100;
            var chunks    = _.chunkize(anchors, chunkSize);         
            
            var processChunk = function (chunk, signalEnd) {                
                try {
                    var chunkSelectables = _.chain(chunk)
                        .filter(function (a) {
                            var bb    = a.getBoundingClientRect(),
                                style = this.window.getComputedStyle(a);

                            // Does the anchor refer to a valid URL?
                            if (!screen.isValidUrl(a.href))         
                                return false;

                            // Does the element have any substance?
                            if (bb.width === 0 || bb.height === 0)  
                                return false;

                            // Is the anchor visible?
                            if (style.display == 'none' || style.visibility == 'hidden')          
                                return false;

                            // Does the anchor pass all applicable targeting rules?
                            if (!this.appliedTargetingRules.test(a))
                                return false;

                            // Anchor is selectable
                            return true;
                        }.bind(this))
                        .map(function (a) {
                            return new Selectable({ target: a, canvas: canvas });
                        })
                        .value();
                    
                    this.selectables = this.selectables.concat(chunkSelectables);
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
            }.bind(this);
            
            _.defer(processChunk, chunks.shift(), function () {
                callback(this.selectables);
            }.bind(this));          
        }
    });

    // Exports
    ns.LinkNinja = LinkNinja;
})(aleciten.linkNinja);