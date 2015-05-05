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
    var _           = ns._,
        prefs       = {},
        prefService = Cc["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),
        branch      = prefService.getBranch("extensions.linkNinja.");        

    var getUCharPref = function (prefName) {    
        return branch.getComplexValue(prefName, Components.interfaces.nsISupportsString).data;
    };

    var setUCharPref = function (prefName, value) {
        var string = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        string.data = value;        
        branch.setComplexValue(prefName, Components.interfaces.nsISupportsString, string);
    };

    var typeHandlers = {
        "32":  { get: getUCharPref,       set: setUCharPref },
        "64":  { get: branch.getIntPref,  set: branch.setIntPref },
        "128": { get: branch.getBoolPref, set: branch.setBoolPref }
    };

    var handlePref = function(name, type, val) {
        if (!typeHandlers[type]) throw "aleciten.linkNinja.prefs: No typeHandler for type \""+type+"\"";
        
        if (val !== undefined) {
            typeHandlers[type].set(name, val);
            return val;
        }
        else {
            return typeHandlers[type].get(name);
        }
    };
    
    var configurePref = function (pref) {
        var fragments = pref.split(".");
        var prefName = fragments.pop();
        
        var prefBranch = _(fragments).reduce(function (branch, frag) {
            if (!branch[frag]) branch[frag] = {};
            return branch[frag];
        }, prefs);

        var prefType = branch.getPrefType(pref);
        prefBranch[prefName] = function (val) {
            return handlePref(pref, prefType, val);
        };
    };

    branch.getChildList("", {}).forEach(configurePref);

    //Exports
    ns.prefs = prefs;   
})(aleciten.linkNinja);