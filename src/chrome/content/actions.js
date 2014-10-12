(function (ns) {
    Cu.import("resource:///modules/PlacesUIUtils.jsm");

    var _               = ns._,
        prefs           = ns.prefs,
        clipboardHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper),
        sessionStore    = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);

    var beforeOpenChildTabs = function (parent) {
        if ("TreeStyleTabService" in window)
            TreeStyleTabService.readyToOpenChildTab(parent, true);
    };

    var afterOpenChildTabs = function (parent) {
        if ("TreeStyleTabService" in window)
            TreeStyleTabService.stopToOpenChildTab(parent);
    };

    var openTabsDeferred = function (links) {
        if (links.length === 0) return;

        var parentTab = gBrowser.selectedTab;         
        var delay = (prefs.action.openTabsDeferred.delay()||0)*1000;

        var openNextLink = function () {
            beforeOpenChildTabs(parentTab);

            try {
                var link = links.shift();
                if (link) gBrowser.addTab(link.href);
                return !!link;
            }            
            finally {
                afterOpenChildTabs(parentTab);
            }
        };

        openNextLink();

        var timer = setInterval(function () {
            try {
                if (!openNextLink()) 
                    clearInterval(timer);                   
            }
            catch (ex) {
                clearInterval(timer);
            }
        }, delay);
    };

    var openTabs = function (links, onDemand) {
        if (links.length === 0) return;

        var parentTab = gBrowser.selectedTab;
        beforeOpenChildTabs(parentTab);

        try {
            _(links).each(function (link) { 
                if (onDemand) {
                    var tab = gBrowser.addTab(null);
                    sessionStore.setTabState(tab, JSON.stringify({
                        entries: [ { url: link.href, title: link.href } ],
                        lastAccessed: 0,
                        index: 1,
                        hidden: false,
                        attributes: {},
                        image: null
                    }));
                }
                else {                  
                    gBrowser.addTab(link.href);             
                }
            });
        }
        finally {
            afterOpenChildTabs(parentTab);              
        }
    };

    var openTabsInNewWindow = function (links) {
        if (links.length === 0) return;

        var firstLink = links.shift();
        window.open(firstLink.href);

        var windowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        var newWindow = windowMediator.getMostRecentWindow("navigator:browser");
        var browser = newWindow.gBrowser;

        _(links).each(function (link) { 
            browser.addTab(link.href);             
        });
    };

    var copyToClipboard = function (links) {
        if (links.length === 0) return;

        var format = prefs.action.copyToClipboard.format();
        var formatted = _(links).reduce(function (acc, link) {
            return acc+format.replace(/\$u/g, link.href).replace(/\$t/g, link.textContent).replace(/\\n/g, "\n");
        }, "");
        
        clipboardHelper.copyString(formatted);
    };

    var bookmark = function (links) {
        if (links.length === 0) return;
        var URIs = _(links).map(function (link) { return makeURI(link.href); });
        
        PlacesUIUtils.showBookmarkDialog({
            action: "add",
            type:   "folder",
            URIList: URIs          
        }, window);
    };

    ns.actions = {
        openTabs: {
            name: "Open in tabs",
            act: function (links) { openTabs(links); },
        },
        openTabsOnDemand: {
            name: "Open in tabs (on demand)",
            act: function (links) { openTabs(links, true); }
        },
        openTabsDeferred: {
            name: "Open in tabs (deferred)",
            act: function (links) { openTabsDeferred(links); }
        },
        openTabsInNewWindow: {
            name: "Open in new window",
            act: openTabsInNewWindow
        },
        copyToClipboard: {
            name: "Copy to clipboard",
            act: copyToClipboard
        },
        bookmark: {
            name: "Bookmark",
            act: bookmark
        }
    };
})(aleciten.linkNinja);