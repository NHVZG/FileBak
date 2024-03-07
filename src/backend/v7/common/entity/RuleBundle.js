class RuleBundle {
    map={};         //,"组名": [RuleBundleItem]
    key='base';    //,主要组名

    append(rbi,key=this.key){
        let list=this.map[key];
        if(!list){
            list=[];
            this.map[key]=list;
        }
        list.push(rbi);
    }
}

export {RuleBundle}