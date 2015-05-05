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
    var _                  = ns._,
        screen             = ns.screen,
        browserContextMenu = ns.browser.contextMenuHelper;

    var Trigger = function (args) {
        _.extend(this, args);       
        this.id = _.uniqueId();     
    };

    var TriggerHandler = function (settings) {
        this.target         = settings.target;
        this.attachedEvents = [];
    };
    _.extend(TriggerHandler.prototype, {
        // Clear references to DOM
        dispose: function () {
            this.stopAll();
            this.target = null;
        },

        start: function (trigger) {         
            if (!trigger) return;

            this.addEventListener(
                trigger.event, 
                function (e) { this.handleTriggerEvent(trigger, e); }.bind(this), 
                true,
                trigger.id
            );
        },

        stop: function (trigger) {
            if (!trigger) return;
            this.removeTriggerEventListeners(trigger.id);
        },

        stopAll: function () {
            this.removeAllEventListeners();
        },

        argsMatch: function (a,b) {
            return  _.chain(a)
                        .keys()
                        .every(function (k) { return b[k] == a[k]; })
                        .value();
        },

        // Checks if the event's args match the trigger's and starts the associated action
        handleTriggerEvent: function (trigger, e) {         
            var originalEventArgs = e;
            var te = trigger.eventArgs;

            // Check if trigger arguments match the event's
            if (te && !this.argsMatch(te, e))
                return;

            // Linux behavior is to show context on mousedown, while Windows' is to show it on mouseup          
            if (e.type === "mousedown" && e.button === 2) {
                browserContextMenu.blockNext();
            }

            e.preventDefault();
            e.stopPropagation();
            
            // If trigger specifies a displacement (mouse needs to move x pixels away from start point), 
            // attach required events
            if (trigger.displacement) {
                this.handleDisplacement(trigger, e);
                return;
            }

            // Arguments match and there's no displacement to wait for
            this.startTriggerAction(trigger, e);
        },
        
        handleDisplacement: function (trigger, e) {
            var originalEventArgs = e;          

            var cancelTracking = function (displacementHit) {
                this.removeEventListener("mousemove", displacementHandler,   true);
                this.removeEventListener("mouseup",   cancelTrackingHandler, true);
                
                // Linux: if mouseup is triggered before the required displacement is reached, 
                // show context menu because we blocked it previously
                if (!displacementHit && originalEventArgs.button === 2) {
                    browserContextMenu.unblock();
                    if (browserContextMenu.wasBlocked()) {
                        browserContextMenu.showLastBlocked();
                    }
                }
            }.bind(this);

            var cancelTrackingHandler = function (e) {
                if (e.button !== originalEventArgs.button) 
                    return;

                cancelTracking(false);
            };

            var displacementHandler = function (e) {
                var origin = screen.toAbsolute(originalEventArgs);
                var pos = screen.toAbsolute(e);

                if (screen.distance(origin, pos) >= trigger.displacement) {                                                     
                    cancelTracking(true);
                    this.startTriggerAction(trigger, originalEventArgs);
                }
            }.bind(this);

            this.addEventListener("mousemove", displacementHandler,   true, trigger.id);
            this.addEventListener("mouseup",   cancelTrackingHandler, true, trigger.id);
        },

        // Start a trigger's action
        startTriggerAction: function (trigger, eventArgs) {
            var e = eventArgs||{};
            e.stop = this.stop.bind(this);
            e.start = this.start.bind(this);
            e.stopAll = this.stopAll.bind(this);

            trigger.action(e);
        },

        // Add event listener and keeps track of it for future removal
        addEventListener: function (type, callback, useCapture, triggerId) {
            this.target.addEventListener(type, callback, useCapture);
            this.attachedEvents.push({ type: type, callback: callback, useCapture: useCapture, triggerId: triggerId });
        },

        // Removes an event listener and clears tracking
        removeEventListener: function (type, callback, useCapture) {
            this.attachedEvents = _(this.attachedEvents).reject(function (e) { 
                var found = e.type == type && e.callback == callback && e.useCapture == useCapture;
                if (found) this.target.removeEventListener(e.type, e.callback, e.useCapture);
                return found;
            }.bind(this));
        },

        // Removes all events belonging to a specific trigger
        removeTriggerEventListeners: function (triggerId) {
            _.chain(this.attachedEvents)
                .filter(function (event) {
                    return (event.triggerId && event.triggerId === triggerId);
                })
                .each(function (event) {
                    this.removeEventListener(event.type, event.callback, event.useCapture);
                }.bind(this));
        },

        // Remove all event listeners added through "this.addEventListener"
        removeAllEventListeners: function () {
            _(this.attachedEvents).each(function (e) { 
                this.target.removeEventListener(e.type, e.callback, e.useCapture); 
            }.bind(this));

            this.attachedEvents = [];
        }
    });

    // Exports  
    ns.TriggerHandler = TriggerHandler;
    ns.Trigger        = Trigger;
})(aleciten.linkNinja);