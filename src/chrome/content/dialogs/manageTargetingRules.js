var _                 = window.opener.aleciten.linkNinja._,
    tree              = null,    
    filterRadioGroup  = null,
    allTargetingRules = null,    
    args              = {},
    url               = "",
    stringBundle      = null,
    valueMaps         = null;

var treeView = {
    get rowCount () { return this.dataSource.length; },
    dataSource: null,
    getCellText : function(row,col) {  
        var dataSource = this.dataSource;

        if (col.id == "colId") {
            return dataSource[row].id;
        }        
        else if (col.id == "colRuleType") {
            return valueMaps.ruleType[dataSource[row].ruleType];
        }
        else if (col.id == "colBoundTo") {
            return dataSource[row].boundUrl;
        }
        else if (col.id == "colTargetType") {
            return valueMaps.targetType[dataSource[row].targetType];
        }
        else if (col.id == "colTargetValue") {
            return dataSource[row].targetValue;
        }        
    },
    getCellValue: function (row, col) {
        var dataSource = this.dataSource;
        if (col.id == "colEnabled") {
            return dataSource[row].enabled;
        }
    },
    getTargetingRuleFromRow: function (row) {
        var localRule = this.dataSource[row];
        var rule = _(allTargetingRules).findWhere({ id: localRule.id });
        return rule
    },
    setMaster: function (id, prop, val) {
        var tr = _(allTargetingRules).findWhere({ id: id });
        tr[prop] = val;
    },
    setCellText: function (row, col, value) {
        var dataSource = this.dataSource;
        var masterRule = this.getTargetingRuleFromRow(row);

        if (col.id == "colBoundTo") {
            dataSource[row].boundUrl = value;
            masterRule.boundUrl = value;
        }
        else if (col.id == "colTargetValue") {
            dataSource[row].targetValue = value;
            masterRule.targetValue = value;
        }
    },
    setCellValue: function (row, col, value) {
        var dataSource = this.dataSource;
        var masterRule = this.getTargetingRuleFromRow(row);
        
        if (col.id == "colEnabled") {
            dataSource[row].enabled = (value === "true");
            masterRule.enabled = (value === "true");
        }     
    },
    deleteRow: function (row) {
        var masterRule = this.getTargetingRuleFromRow(row);

        this.dataSource.splice(row,1);
        allTargetingRules.splice(allTargetingRules.indexOf(masterRule), 1);
        this.treebox.rowCountChanged(row, -1);
    },
    setTree: function(treebox){ this.treebox = treebox; },
    isContainer: function(row){ return false; },
    isSeparator: function(row){ return false; },
    isSorted: function(){ return false; },
    isEditable: function (row, col) { 
        return (["colEnabled", "colBoundTo", "colTargetValue"].indexOf(col.id) >= 0);
    },
    getLevel: function(row){ return 0; },
    getImageSrc: function(row,col){ return null; },
    getRowProperties: function(row,props){},
    getCellProperties: function(row,col,props){},
    getColumnProperties: function(colid,col,props){}
};

function onLoad() { 
    args             = window.arguments[0];
    url              = args.url;
    stringBundle     = document.getElementById("linkNinja-manageTargetingRulesStringBundle");
    tree             = document.getElementById("targetingRulesTree");    
    filterRadioGroup = document.getElementById("filterRadioGroup");
    
    valueMaps = {
        "ruleType": { 
            "inc": stringBundle.getString("rule.include"), 
            "exc": stringBundle.getString("rule.exclude")
        },
        "targetType": { 
            "cssSelector": stringBundle.getString("rule.cssSelector"), 
            "urlPattern":  stringBundle.getString("rule.urlPattern")
        }
    };

    loadTargetingRules();
    refreshTree(filterRadioGroup.selectedItem.value === "filter");

    window.sizeToContent();
}

function onDialogAccept() {
    args.targetingRules = getCleanTargetingRules();
}

function onDialogCancel() {
    args.cancel = true; 
    return true;
}

function onFilterChange() {
    refreshTree(filterRadioGroup.selectedItem.value === "filter");  
}

function getCleanTargetingRules() {
    var cleanRules = _.clone(allTargetingRules);
    _(cleanRules).each(function (tr) { delete tr.id; });        

    return cleanRules;
}

function loadTargetingRules() { 
    allTargetingRules = _.chain(args.targetingRules)
        .sort(function (tr) { return tr.ruleType; })
        .each(function (tr) { tr.id = _.uniqueId("tr"); })
        .value();
}

function refreshTree(filter) {
    var visibleTargetingRules = _.clone(allTargetingRules);
    
    if (filter) {       
        visibleTargetingRules = _(visibleTargetingRules).reject(function (tr) {
            return (tr.boundUrl && !_.matchesWildcard(url, tr.boundUrl));
        });
    }

    treeView.dataSource = visibleTargetingRules;    
    tree.view = treeView;
}

function deleteTargetingRule() {
    var rowIndex = tree.currentIndex;
    treeView.deleteRow(rowIndex);
}

