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
	var _ = ns._,
		popupMenuId = "linkNinja-actionMenu",
		actions = ns.actions;


	var ActionMenu = function (args) {
		this.selection = args.selection||[];
		this.callback = args.callback;
		this.build();
	};
	_.extend(ActionMenu.prototype, {
		build: function () {
			var menuitem = null, 
				noSelection = this.selection.length === 0,
				popup = document.getElementById(popupMenuId);

			popup.innerHTML = "";
			_(actions).chain().keys().each(function (key) {
				var action = actions[key];

				menuItem = document.createElement("menuitem");
				menuItem.setAttribute("label", action.name);
				if (noSelection) menuItem.setAttribute("disabled", true);
				menuItem.setAttribute("value", key);

				popup.appendChild(menuItem);
			});

			menuItem = document.createElement("menuseparator");
			popup.appendChild(menuItem);

			menuItem = document.createElement("menuitem");
			menuItem.setAttribute("label", "Cancel");
			menuItem.setAttribute("value", null);
			popup.appendChild(menuItem);
		},

		open: function (x,y) {
			var popup = document.getElementById(popupMenuId);

			var removeHandlers = function () {
				popup.removeEventListener("click", popupHandler, true);
				popup.removeEventListener("popuphidden", noActionHandler, true);
			};

			var popupHandler = function (e) {
				if (e.target.nodeName !== 'menuitem') return;
				if (e.target.hasAttribute("disabled")) return;

				removeHandlers();
				var val = e.target.getAttribute("value");
				this.callback(ns.actions[val]);
			}.bind(this);
			
			var noActionHandler = function () {
				removeHandlers();
				this.callback(null);
			}.bind(this);

			popup.addEventListener("click", popupHandler, true);
			popup.addEventListener("popuphidden", noActionHandler, true);
			popup.openPopupAtScreen(x, y, true);
		}
	});

	ns.ActionMenu = ActionMenu;
})(aleciten.linkNinja);