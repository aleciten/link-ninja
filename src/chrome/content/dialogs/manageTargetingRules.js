var _                = window.opener.aleciten.linkNinja._,
    tree             = null,
    treeChildren     = null,
    filterRadioGroup = null,
    targetingRules   = null,
    args             = {},
    url              = "",
    stringBundle     = null,
    valueMaps        = null;

function onLoad() { 
    args = window.arguments[0];
    stringBundle = document.getElementById("strings");
    url = args.url;
    tree = document.getElementById("targetingRulesTree");
    treeChildren = document.getElementById("targetingRulesTreeChildren");
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
    var cleanRules = _.clone(targetingRules);
    _(cleanRules).each(function (tr) { delete tr.id; });        

    return cleanRules;
}

function getMappedValue(prop, val) {
    var map = valueMaps[prop];
    if (map&&map[val]) return map[val];
    else return val;
}

function createRuleEntry(id, enabled, ruleType, boundUrl, targetType, targetValue) {
    var ti = document.createElement("treeitem");
    var tr = document.createElement("treerow");
    
    var tcId = document.createElement("treecell");
    tcId.setAttribute("label", id);
    tcId.setAttribute("data-propertyName", "id");   
    
    var tcEnabled = document.createElement("treecell");
    tcEnabled.setAttribute("value", enabled);
    tcEnabled.setAttribute("data-propertyName", "enabled"); 
    
    var tcRuleType = document.createElement("treecell");
    tcRuleType.setAttribute("label", getMappedValue("ruleType", ruleType));
    tcRuleType.setAttribute("editable", "false");
    tcRuleType.setAttribute("data-propertyName", "ruleType");

    var tcBoundUrl = document.createElement("treecell");
    tcBoundUrl.setAttribute("label", boundUrl);
    tcBoundUrl.setAttribute("data-propertyName", "boundUrl");   

    var tcTargetType = document.createElement("treecell");
    tcTargetType.setAttribute("label", getMappedValue("targetType", targetType));
    tcTargetType.setAttribute("editable", "false");
    tcTargetType.setAttribute("data-propertyName", "targetType");
    
    var tcTargetValue = document.createElement("treecell");
    tcTargetValue.setAttribute("label", targetValue);
    tcTargetValue.setAttribute("data-propertyName", "targetValue");
    
    tr.appendChild(tcId);
    tr.appendChild(tcEnabled);
    tr.appendChild(tcRuleType);
    tr.appendChild(tcBoundUrl); 
    tr.appendChild(tcTargetType);
    tr.appendChild(tcTargetValue);
    ti.appendChild(tr);
    tr.addEventListener("DOMAttrModified", onTreeCellAttributeChange, false);

    return ti;
}

function onTreeCellAttributeChange(e) {
    var ruleId = e.target.parentNode.childNodes[0].getAttribute("label");
    var propName = e.target.getAttribute("data-propertyName");
    var propertyParse = {
        "enabled": function (node) { return node.getAttribute("value") === "true"; }        
    };
    
    var targetingRule = _(targetingRules).findWhere({ id: ruleId });
    if (targetingRule) {
        targetingRule[propName] = propertyParse[propName] ? propertyParse[propName](e.target) : e.target.getAttribute("label");
    }
}

function loadTargetingRules() { 
    targetingRules = args.targetingRules;
    _.chain(targetingRules)
        .sort(function (tr) { return tr.ruleType; })
        .each(function (tr) { tr.id = _.uniqueId("tr"); })
        .value();
}

function refreshTree(filter) {
    var visibleTargetingRules = _.clone(targetingRules);
    
    if (filter) {       
        visibleTargetingRules = _(targetingRules).reject(function (tr) {
            return (tr.boundUrl && !_.matchesWildcard(url, tr.boundUrl));
        });
    }

    treeChildren.innerHTML = "";    
    _(visibleTargetingRules).each(function (tr) {
        var ti = createRuleEntry(tr.id, !!tr.enabled, tr.ruleType, tr.boundUrl, tr.targetType, tr.targetValue);
        treeChildren.appendChild(ti);
    });
}

function deleteTargetingRule() {
    var item = treeChildren.childNodes[tree.currentIndex];
    var id = item.childNodes[0].childNodes[0].getAttribute("label");

    targetingRules = _(targetingRules).reject(function (tr) { return tr.id === id; });
    treeChildren.removeChild(item);
}

