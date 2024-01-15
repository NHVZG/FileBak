import {RULE_CONFIGS} from "@/backend/v5/common/entity/Rule";

class RuleBundle{
    map={};                    //, {key:[NodeRule]}
    key='base';

    constructor(ruleList=[],key=this.key) {
        this.map[key] = ruleList.slice();
        this.key=key;
    }

    //. 匹配的规则集合
    check(base,key=this.key){
        let matches=
             this.get(key,[])
            .filter(nr=>nr.rule.test(base))
            .map(nr=>nr.rule.copyAsMatch(base));
        return new RuleBundle(matches,key);
    }

    //. 继承的规则集合
    inherits(node,key=this.key){
        let inherits=this.get(key,[])
            .filter(nr=>nr.rule.inherit(node))
            .map(nr=>nr.rule.copyAsInherit(node));
        return new RuleBundle(inherits,key);
    }

    //. 获取分组
    get(key=this.key,defaults){
        if(this.map[key]){
            return this.map[key];
        }
        return defaults;
    }

    //. 添加
    append(rules=new RuleBundle()){
        for(let key of Object.keys(rules.map)){
            let list=this.map[key];
            if(!list){
                this.map[key]=rules.map[key];
            }else{
                let map= new Map();
                list.map(nr=>map.set(nr.rule,nr));
                rules.map[key].map(nr=>{
                    if(!map.get(nr.rule)){
                        map.set(nr.rule,nr);
                    }
                });
                let list=[];
                this.map[key]=map.forEach(nr=>list.push(nr));
            }
        }
        return this;
    }

    //.排序
    //, 先根据最接近规则（继承代数最小），再根据规则配置的优先级，最后根据规则的顺序
    sorts(){
        Object.entries(this.map)
            .map(entry => {
                let ruleList = entry[1];
                if (ruleList.length < 2) return ruleList;
                ruleList.map((nodeRule, idx) => ({idx, nodeRule}));
                return ruleList.sort((a,b)=>{
                    if(a.nodeRule.rule.mode===RULE_CONFIGS.normal)return 1;
                    if(b.nodeRule.rule.mode===RULE_CONFIGS.normal)return -1;
                    let ai=a.nodeRule.rule.mode.penetrate?-1*a.nodeRule.generation:a.nodeRule.generation;
                    let bi=b.nodeRule.rule.mode.penetrate?-1*b.nodeRule.generation:b.nodeRule.generation;
                    if(ai!==bi)return ai-bi;
                    if(a.nodeRule.rule.mode.order!==b.nodeRule.rule.mode)return a.nodeRule.rule.mode.order-b.nodeRule.rule.mode;
                    return a.idx-b.idx;
                }).map(i=>i.nodeRule);
            });
    }

    //. 生效第一规则
    cur(key){
        return this.get(key,[])[0];
    }


    //. 含有穿透规则，无视所有其他规则都被覆盖
    blackHole(key){
        return this.get(key,[]).some(nr=>nr.rule.mode.penetrate);
    }

    //. 映射规则
    mappings(key){
        return this.get(key,[]).filter(r=>r.rule.target);
    }


}

export {RuleBundle}