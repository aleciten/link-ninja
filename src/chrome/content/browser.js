(function (ns) {
    var _            = ns._,
        prefs        = ns.prefs,
        addonManager = Cu.import("resource://gre/modules/AddonManager.jsm").AddonManager;

    var browser = {
        attachedNinjas: [],
        
        onLoad: function() {
            browser.runChecks();
            browser.refreshToolbarState();
            gBrowser.addEventListener("DOMContentLoaded", browser.onPageLoad, false);
        },

        onPageLoad: function (e) {
            var doc = e.originalTarget;
            if (doc.nodeName != "#document") return; // only documents

            var win = doc.defaultView;
            if (win != win.top) return; //only top window.
            if (win.frameElement) return;
            
            var ln = new ns.LinkNinja({ document: doc, console: console });
            if (prefs.enabled()) ln.start();

            browser.attachedNinjas.push(ln);
            win.addEventListener("unload", function () { browser.unloadNinja(ln); }, false);
        },

        runChecks: function () {
            addonManager.getAddonByID(ns.extensionId, function (addon) {
                if (prefs.firstRun()) {
                    prefs.firstRun(false);
                    prefs.installedVersion(addon.version);
                    browser.onFirstRun();
                }
                else {
                    var installedVersion = prefs.installedVersion();
                    if (addon.version > installedVersion) {
                        prefs.installedVersion(addon.version);
                        browser.onUpgrade(installedVersion);
                    }
                }
            });
        },

        onFirstRun: function () {
            browser.installToolbarButton();
        },

        onUpgrade: function (fromVersion) {
        },

        installToolbarButton: function () {
            var buttonId = "linkNinja-toolbar-button";
            var toolbar = document.getElementById("addon-bar");

            toolbar.insertItem(buttonId, null);
            toolbar.setAttribute("currentset", toolbar.currentSet);
            document.persist(toolbar.id, "currentset");         
            toolbar.collapsed = false;
        },      

        refreshToolbarState: function () {
            var toolbarButton = document.getElementById("linkNinja-toolbar-button");
            if (!toolbarButton) return;

            if (prefs.enabled()) {
                toolbarButton.removeAttribute("disabled");
                toolbarButton.setAttribute("tooltiptext", "LinkNinja is enabled");
            }
            else {
                toolbarButton.setAttribute("disabled", "yes");
                toolbarButton.setAttribute("tooltiptext", "LinkNinja is disabled");             
            }
        },

        toolbarButtonClick: function (e) {
            if (e.getAttribute("buttonover") === "true") {
                if (prefs.enabled()) {
                    prefs.enabled(false);
                    browser.disableAllNinjas();
                }
                else {
                    prefs.enabled(true);
                    browser.enabledAllNinjas();
                }
                browser.refreshToolbarState();
            }
        },
        
        forEachNinja: function (action) {
            _(browser.attachedNinjas).each(action);
        },

        enabledAllNinjas: function() {
            browser.forEachNinja(function (ln) { ln.start(); });
        },

        disableAllNinjas: function () {
            browser.forEachNinja(function (ln) { ln.stop(); });
        },
        
        unloadNinja: function (ninja) {
            var index = browser.attachedNinjas.indexOf(ninja);
            if (index >= 0) browser.attachedNinjas.splice(index,1);
        },

        onOptionsChanged: function () {
            browser.forEachNinja(function (ln) { ln.reloadSettings(); });
        },

        getCurrentUri: function () {
            /*var windowsService = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
            var currentWindow = windowsService.getMostRecentWindow('navigator:browser');*/          
            var currentWindow = window;
            var currentBrowser = currentWindow.getBrowser();
            var uri = currentBrowser.currentURI;
            return uri;
        },

        openManageTargetingRulesDialog: function () {           
            var uri = this.getCurrentUri();         
            
            var args = { 
                url: uri.spec,
                targetingRules: JSON.parse(prefs.targetingRules())
            };

            openDialog('chrome://linkNinja/content/dialogs/manageTargetingRules.xul',
                '',
                'centerscreen,chrome,modal,dialog=no,resizable=no', args);

            if (args.cancel) return;
            var targetingRules = args.targetingRules;

            this.saveTargetingRules(targetingRules);            
        },

        saveTargetingRules: function (targetingRules) {         
            prefs.targetingRules(JSON.stringify(targetingRules));
        },

        openCreateTargetingRuleDialog: function () {
            var uri = this.getCurrentUri();
            var args = { 
                uri: uri,
                existingRules: JSON.parse(prefs.targetingRules())
            };
            
            openDialog('chrome://linkNinja/content/dialogs/createTargetingRule.xul',
                '', 
                'centerscreen,chrome,modal,dialog=no,resizable=no', args);
            
            if (args.cancel) return;
            if (!args.newRule) return;
            
            var newRule = args.newRule;
            if (!newRule.ruleType || !newRule.boundUrl || !newRule.targetType || !newRule.targetValue)              
                return;
            
            this.createTargetingRule(newRule);
        },

        openOptionsDialog: function () {
            openDialog('chrome://linkNinja/content/dialogs/options.xul',
                '', 
                'chrome,titlebar,toolbar,centerscreen,dialog=yes,modal=yes');
        },

        createTargetingRule: function (targetingRule) {
            var targetingRules = JSON.parse(prefs.targetingRules());            
            targetingRules.push(targetingRule);
            this.saveTargetingRules(targetingRules);
        }
    };

    window.addEventListener("load", browser.onLoad, false);

    ns.browser = browser;
})(aleciten.linkNinja);