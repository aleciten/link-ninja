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
    var _                        = ns._,
        lastContextMenuEventArgs = null,
        wasContextMenuBlocked    = false,
        attached                 = false;

    var blockContextMenuHandler = function (e) {        
        lastContextMenuEventArgs = _.clone(e);
        wasContextMenuBlocked = true;
        
        var contextMenu = document.getElementById('contentAreaContextMenu');
        _.defer(unblockContextMenu);
        
        e.preventDefault();
        return false;
    };

    var blockNextContextMenu = function () {        
        if (attached) return;
        
        attached = true;
        lastContextMenuEventArgs = null;
        wasContextMenuBlocked = false;
        
        var contextMenu = document.getElementById('contentAreaContextMenu');
        contextMenu.addEventListener('popupshowing', blockContextMenuHandler, true);                
    };
    
    var unblockContextMenu = function () {
        var contextMenu = document.getElementById('contentAreaContextMenu');
        contextMenu.removeEventListener('popupshowing', blockContextMenuHandler, true);
        attached = false;
    };

    var showLastBlockedContextMenu = function () {  
        if (!wasContextMenuBlocked) return;

        var e = lastContextMenuEventArgs;
        var event = document.createEvent("MouseEvents");
        
        event.initMouseEvent(
            'contextmenu', 
            true,      true,      window,     0,
            e.screenX, e.screenY, e.clientX,  e.clientY,
            e.ctrlKey, e.altKey,  e.shiftKey, e.metaKey,
            e.button,  null);
        
        window.gContextMenu.target.dispatchEvent(event);
    };

    // Exports
    ns.browser.contextMenuHelper = {
        wasBlocked:      function () { return wasContextMenuBlocked; },
        blockNext:       blockNextContextMenu,
        unblock:         unblockContextMenu,
        showLastBlocked: showLastBlockedContextMenu
    };
})(aleciten.linkNinja);