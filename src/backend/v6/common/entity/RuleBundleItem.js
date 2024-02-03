import {NodeBundle} from "@/backend/v5/common/entity/NodeBundle";

class RuleBundleItem {
    source;                 //, 源节点
    target;                  //, 映射节点
    match;                  //, 匹配规则节点（继承时）- 保留
    root;                     //, 源树根节点 - 保留
    merge;                  //, 合并前节点 - 保留

    rule;                                                                              //, 规则配置
    generation=0;                                                              //, 继承代数
}

export {RuleBundleItem}