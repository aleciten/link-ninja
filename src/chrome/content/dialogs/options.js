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

var windowsService = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator),
    browserWindow  = windowsService.getMostRecentWindow('navigator:browser'),
    prefService    = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),    
    ns             = browserWindow.aleciten.linkNinja,
    prefs          = ns.prefs,
    _              = ns._;

function $(selector) {
    var ret = document.querySelectorAll(selector);
    if (ret.length === 1) return ret[0];
    else return ret;
}

function onBeforeAccept() {
    return validate();
}

function onDialogAccept() {
    if (validate()) {
        ns.browser.onOptionsChanged();
    }
    else {
        return false;
    }
}

function onLoad() {
    $("#cancelKeyGrabber").addEventListener("keydown", grabberKeyDown, true);
    $("#cancelKeyGrabber").addEventListener("contextmenu", grabberCancelContext);
    $("#actionMenuKeyGrabber").addEventListener("keydown", grabberKeyDown, true); 
    $("#actionMenuKeyGrabber").addEventListener("contextmenu", grabberCancelContext);

    cancelTriggerTypeChanged($("#cancelTriggerType").selectedItem.value === "key");
    actionMenuTriggerTypeChanged($("#actionMenuTriggerType").selectedItem.value === "key");
    
    _($("textbox[data-pickerId]")).each(function (e) {
        $("#"+e.getAttribute("data-pickerId")).color = e.value;
    }); 
    
    // Damn SCALE elements don't fetch their preference value
    $("#selectorOpacity").value = prefs.selector.opacity();
    $("#selectableOpacity").value = prefs.selectable.opacity();

    $("#cancelKeyGrabber").value = $("#cancelKeyName").value;
    $("#actionMenuKeyGrabber").value = $("#actionMenuKeyName").value;

    setupPreview();
}

function validate() {
    var ret = true;
    var startButton = $("#startTriggerMouseButtonGroup").selectedItem.value;

    var cancelType = $("#cancelTriggerType").selectedItem.value;
    var cancelButton  = (cancelType === "mouse") ? $("#cancelTriggerMouseButtonGroup").selectedItem.value : "-2";
    var cancelKeyCode = (cancelType === "key")   ? $("#cancelKeyCode").value                              : "-2";

    var actionMenuType = $("#actionMenuTriggerType").selectedItem.value;
    var actionMenuButton  = (actionMenuType === "mouse") ? $("#actionMenuTriggerMouseButtonGroup").selectedItem.value : "-3";
    var actionMenuKeyCode = (actionMenuType === "key")   ? $("#actionMenuKeyCode").value                              : "-3";

    _($("radio[class='validationError'],textbox[class='validationError']")).each(function (elem) { elem.removeAttribute("class"); });

    if (startButton === cancelButton) {
        $("#startTriggerMouseButtonGroup").selectedItem.setAttribute("class","validationError");
        $("#cancelTriggerMouseButtonGroup").selectedItem.setAttribute("class","validationError");
        ret = false;
    }
    if (startButton === actionMenuButton) {
        $("#startTriggerMouseButtonGroup").selectedItem.setAttribute("class", "validationError");
        $("#actionMenuTriggerMouseButtonGroup").selectedItem.setAttribute("class","validationError");
        ret = false;
    } 
    if (cancelButton === actionMenuButton) {
        $("#cancelTriggerMouseButtonGroup").selectedItem.setAttribute("class", "validationError");
        $("#actionMenuTriggerMouseButtonGroup").selectedItem.setAttribute("class","validationError");
        ret = false;
    }
    if (cancelKeyCode == actionMenuKeyCode) {
        $("#cancelKeyGrabber").setAttribute("class", "validationError");
        $("#actionMenuKeyGrabber").setAttribute("class","validationError");
        ret = false;        
    }
    
    if (!ret) {
        $("prefwindow").showPane($("#trigger-prefPane"));
    }

    return ret;
}

function setupPreview() {
    onSelectorFillColorChanged($("#selectorFillColor"));
    onSelectorBorderColorChanged($("#selectorBorderColor"));
    onSelectorOpacityChanged($("#selectorOpacity"));
    onSelectableFillColorChanged($("#selectableFillColor"));
    onSelectableBorderColorChanged($("#selectableBorderColor"));
    onSelectableOpacityChanged($("#selectableOpacity"));
}

function onSelectorFillColorChanged(elem) {
    onColorChanged(elem);
    $("#svgSelector").setAttribute("fill", elem.value);
}

function onSelectorBorderColorChanged(elem) {
    onColorChanged(elem);
    $("#svgSelector").setAttribute("stroke", elem.value);
}

function onSelectorOpacityChanged(elem) {
    $("#svgSelector").setAttribute("fill-opacity", elem.value / 100);
}

function onSelectableFillColorChanged(elem) {
    onColorChanged(elem);
    _($(".svgSelectable")).each(function (s) { s.setAttribute("fill", elem.value); });
}

function onSelectableBorderColorChanged(elem) {
    onColorChanged(elem);
    _($(".svgSelectable")).each(function (s) { s.setAttribute("stroke", elem.value); });
}

function onSelectableOpacityChanged(elem) {
    _($(".svgSelectable")).each(function (s) { s.setAttribute("fill-opacity", elem.value / 100); });
}

function onColorChanged(elem) {
    var picker = $("#"+elem.getAttribute("data-pickerId"));
    picker.color = elem.value;
}

function onColorPickerSelect(elem) {
    var textbox = $("#"+elem.getAttribute("data-displayId"));
    textbox.value = elem.color;
    triggerOnChange(textbox);
}

function actionMenuTriggerTypeChanged(type) {
    $("#actionMenuTriggerMouseButtonGroup").disabled = !!type;
    $("#actionMenuKeyGrabber").disabled = !type;
}

function cancelTriggerTypeChanged(type) {
    $("#cancelTriggerMouseButtonGroup").disabled = !!type;
    $("#cancelKeyGrabber").disabled = !type;
}

function triggerOnChange(elem) {
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent('change', true, true);
    elem.dispatchEvent(evt);
}

function grabberKeyDown(e) {    
    var keyCodeElem = $("#"+e.target.getAttribute("data-keyCodeStore"));
    keyCodeElem.value = e.keyCode;
    triggerOnChange(keyCodeElem);

    var keyNameElem = $("#"+e.target.getAttribute("data-keyNameStore"));
    keyNameElem.value = e.key;
    triggerOnChange(keyNameElem);

    e.target.value = e.key;

    e.preventDefault();
    e.stopPropagation();
    return false;
}

function grabberMouseDown(e) {
    var map = { 0: "Left", 1: "Middle", 2:"Right", 3:"Dunno", 4:"Dunno"};
    e.target.value = map[e.button];
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function grabberCancelContext(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;   
}