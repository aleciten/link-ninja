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

(function(ns) { 
    var prefs = {
        "firstRun":                        function () { return true },
        "installedVersion":                function () { return "0.5" },
        "enabled":                         function () { return true },
        "defaultAction":                   function () { return "openTabs" },
        "targetingRules":                  function () { return "[]" },

        "action": { 
            "copyToClipboard": { 
                "format":   function () { return "$u\\n" } 
            },
            "action": { 
                "openTabsDeferred": { 
                    "delay":   function () { return 1 } 
                }
            }
        },

        "startTrigger": { 
            "mouseButton":        function () { return 2 },
            "altKey":             function () { return false },
            "ctrlKey":            function () { return false },
            "shiftKey":           function () { return false },
            "displacementRequired": function () { return true },
            "displacement":       function () { return 20 }
        },

        "cancelTrigger": { 
            "enabled":           function () { return true },
            "type":              function () { return "key" },
            "keyCode":           function () { return 27 },
            "keyName":           function () { return "Esc" }, 
            "mouseButton":       function () { return 0 } 
        },

        "actionMenuTrigger": { 
            "enabled":       function () { return true },
            "type":          function () { return "mouse" },
            "keyCode":       function () { return 0 },
            "keyName":       function () { return "" },
            "mouseButton":   function () { return 1 } 
        },

        "selector": { 
            "fillColor":              function () { return "#3399ff" },        
            "borderColor":            function () { return "#3399ff" },        
            "opacity":                function () { return 10 },    
            "findHitsChunkSize":      function () { return 30 }
        },

        "selectable": { 
            "fillColor":            function () { return "#3399ff" },        
            "borderColor":          function () { return "#3399ff" },       
            "opacity":              function () { return 10 }
        }
    };

    //Exports
    ns.prefs = prefs; 
})(aleciten.linkNinja);