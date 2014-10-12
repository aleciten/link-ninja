(function (ns) {
    var _     = ns._,
        prefs = ns.prefs;

    var getRulesBoundToUrl = function (url) {
        targetingRules = _.chain(JSON.parse(prefs.targetingRules()))
            .filter(function (tr) {
                return tr.boundUrl    &&
                       tr.enabled     && 
                       tr.ruleType    && 
                       tr.targetType  &&
                       tr.targetValue &&                       
                       _.matchesWildcard(url, tr.boundUrl);
            })
            .map(function (tr) {
                return new TargetingRule(tr);
            })
            .value();

        return new TargetingRuleCollection(targetingRules);
    };

    var TargetingRule = function (args) {
        if (!args.ruleType || !args.targetType || !args.targetValue)
            throw "No args provided";
        if (!this.typeTesters[args.targetType])
            throw "No tester available for specified target type";

        this.ruleType    = args.ruleType;
        this.targetType  = args.targetType;
        this.isNegative  = args.targetValue[0] === "!";

        this.targetValue = args.targetValue;
        if (this.isNegative) {
            this.targetValue = this.targetValue.substring(1, this.targetValue.length);
        }
    };
    _.extend(TargetingRule.prototype, {
        typeTesters: {
            "cssSelector": function (elem) {
                return elem.mozMatchesSelector(this.targetValue);
            },
            "urlPattern": function (elem) {
                return _.matchesWildcard(elem.getAttribute("href"), this.targetValue);
            }
        },
        isNegative: function () {
            return this.isNegative;
        },
        isInclude: function () {
            return this.ruleType === "inc";
        },
        isExclude: function () {
            return this.ruleType === "exc";
        },
        // Test rule against an element. If the first character of the rule value is "!" then negate it
        test: function (elem) {
            var test = this.typeTesters[this.targetType].call(this, elem);
            return this.isNegative ? !test : test;
        }
    });

    var TargetingRuleCollection = function (rules) {
        this.rules = rules||[];
        Object.defineProperty(this, "length", { get: function () { return this.rules.length; } });
    };
    _.extend(TargetingRuleCollection.prototype, {
        // Test an element against a collection of targeting rules.
        // Returns true if the element matches at least one inclusion rule and doesn't match any exclusion rules.
        test: function (elem) {
            var inc = !!_(this.rules).find(function (rule) { return rule.isInclude() && rule.test(elem); });
            var exc = !!_(this.rules).find(function (rule) { return rule.isExclude() && rule.test(elem); });
            return (this.rules.length === 0 || (inc && !exc));
        }        
    });
    
    // Exports
    ns.targeting = {
        getRulesBoundToUrl:      getRulesBoundToUrl,
        TargetingRule:           TargetingRule,
        TargetingRuleCollection: TargetingRuleCollection
    };
})(aleciten.linkNinja);