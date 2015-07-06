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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
    	case "action":
    		actions[request.action].apply(this, JSON.parse(request.args));    	
    		break;
    }
});

var actions = {
	"openTabs": function (links, onDemand) {
        if (links.length === 0) return;
		
		links.forEach(function (link) {
			var params = {
    			url: link.href,
    			active: false
			}
			chrome.tabs.create(params);
		});		
	},
	"openTabsInNewWindow": function (links) {
		if (links.length === 0) return;
        alert("OPEN IN NEW WIN");
	},
	"copyToClipboard": function (links) {
        if (links.length === 0) return;
        alert("COPY TO CLIP");
        /*var format = prefs.action.copyToClipboard.format();
        var formatted = _(links).reduce(function (acc, link) {
            return acc+format.replace(/\$u/g, link.href).replace(/\$t/g, link.textContent).replace(/\\n/g, "\n");
        }, "");
        
        clipboardHelper.copyString(formatted);*/
    },
    "bookmark": function (links) {
    	if (links.length === 0) return;

    	var addToParent = function(parentId) {
    		links.forEach(function (link) {
    			chrome.bookmarks.create({ 
    				parentId: parentId,
    				url: link.href,
    				title: link.title  				
    			})    			
    		})
    	};

    	chrome.bookmarks.search({ title: "Link Ninja"}, function (nodes) {    		
    		if (nodes.length > 0) addToParent(nodes[0].id)
    		else chrome.bookmarks.create({ title: "Link Ninja" }, function (node) { 
    			addToParent(node.id);
    		});
    	});
    }
};