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

    var parseLinks = function(links) {        
        return _(links).map(function (l) { 
            return { 
                href:  l.href,
                title: l.textContent
            }
        });
    };

    var sendAction = function (action, links, param1, param2) {
        console.log("SEND",action);
        
        chrome.extension.sendMessage({
            type:   "action",
            action: action,
            args:   JSON.stringify([parseLinks(links),param1,param2])
        });
    };

    ns.actions = {
        openTabs: {
            name: "Open in tabs",
            act: sendAction.bind(null, "openTabs")
        },
        openTabsOnDemand: {
            name: "Open in tabs (on demand)",
            act: sendAction.bind(null, "openTabs", true)
        },
        openTabsDeferred: {
            name: "Open in tabs (deferred)",
            act: sendAction.bind(null, "openTabsDeferred")
        },
        openTabsInNewWindow: {
            name: "Open in new window",
            act: sendAction.bind(null, "openTabsInNewWindow")
        },
        copyToClipboard: {
            name: "Copy to clipboard",
            act: sendAction.bind(null, "copyToClipboard")
        },
        bookmark: {
            name: "Bookmark",
            act: sendAction.bind(null, "bookmark")
        }
    };
})(aleciten.linkNinja);