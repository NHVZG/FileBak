class RuleBundle{
    map={};                    //, {key:[NodeRulle]}
    key='base';

    constructor(key,ruleList) {
        if(key&&ruleList) {
            this.map[key] = ruleList;
        }
    }

    check(base,key){
        let rules=this.get(key);
        let matches=rules.filter(nr=>nr.rule.test(base));
        return new RuleBundle(key,matches);
    }

    //. 获取分组
    get(key=this.key,defaults){
        if(this.map[key]){
            return this.map[key];
        }
        return defaults;
    }

    put(key=this.key,values){
        this.map[key]=values;
    }

    //. 继承的规则
    inherits(node,key){
        let rules=this.get(key,[])
      /*                      .filter(r=>{
                                if(node.inZip&&(!r.config.through))return false;
                                if(matchMode&&(matchMode!==r.config.dispatch))return false;
                                let conf=this.config(r);
                                return conf.penetrate||conf.inherit;  })
                            .map(r=>r.instanceInherit(source));*/
        return new RuleBundle(rules,key||this.mainKey)
    }

    //. 含有穿透规则，无视所有其他规则都被覆盖
    blackHole(){

    }

    //. 映射规则
    mappings(key){
        return this.get(key,[]).filter(r=>r.rule.target);
    }


}

export {RuleBundle}