class NodeBundle{
    source;                 //, 源节点
    target;                  //, 映射节点
    match;                  //, 匹配规则节点（继承时）- 保留
    root;                     //, 源树根节点 - 保留
    merge;                  //, 合并前节点 - 保留


    constructor(source, target, match, root, merge) {
        this.source = source;
        this.target = target;
        this.match = match;
        this.root = root;
        this.merge = merge;
    }

}

export {NodeBundle}