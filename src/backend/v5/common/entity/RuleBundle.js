class RuleBundle{
    map={};                    //, {key:[NodeRule]}
    key='base';

    constructor(ruleList,key=this.key) {
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
    sorts(){
        Object
            .entries(this.map)
            .map(entry=>{

            });
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