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

var existingRules = null;

function $(selector) {
    var ret = document.querySelectorAll(selector);
    if (ret.length === 1) return ret[0];
    else return ret;
}

function onLoad() {
    var args = window.arguments[0]; 
    existingRules = args.existingRules;
    refreshBindToList(args.uri);
    window.sizeToContent();
}

function onDialogCancel() {
    var args = window.arguments[0];
    args.cancel = true;
    return true;
}

function onDialogAccept() { 
    var args = window.arguments[0];
    
    var ruleType = $("#ruleType").selectedItem.value;
    var targetType = $("#targetType").selectedItem.value;
    var targetValue = $("#targetValue").value;
    var boundUrl = $("#bindToRadioGroup").selectedItem.value;

    if (!ruleType || !targetType || !targetValue || !boundUrl) 
        return false;

    args.newRule = {
        enabled:     true,
        boundUrl:    boundUrl,      
        ruleType:    ruleType,
        targetType:  targetType,
        targetValue: targetValue
    };
    
    return true;
}

function onRuleTypeChanged (menu) { 
    $("#ruleDescription").textContent = menu.selectedItem.getAttribute("data-description");
}

function refreshBindToList(uri) {
    var rg = document.getElementById("bindToRadioGroup");
    rg.innerHTML = "";
    var opts = [];
    var base = "";
        
    opts.push(uri.prePath+"/*");
        
    var fragments = uri.path.substring(1).split("/");
    fragments.splice(-1);
    fragments.forEach(function (frag) {
        base += "/"+frag;
        opts.push(uri.prePath + base+"/*");
    }); 
    opts.push(uri.prePath+uri.path);

    opts.forEach(function (o) {     
        var radio = document.createElement("radio");
        radio.setAttribute("label", o);
        radio.setAttribute("value", o);
        radio.setAttribute("selected", rg.childNodes.length === 0);
        rg.appendChild(radio);
    });
}