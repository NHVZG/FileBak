class NodeRule{
    rule;                       //, 规则配置
    nodes;                    //, 节点集合
    generation=0;        //, 继承代数

    test(node){
        return this.rule.test(node);
    }


}

export {NodeRule}