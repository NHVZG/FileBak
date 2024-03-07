import {RuleBundle} from "@/backend/v7/common/entity/RuleBundle";

class Node {
    rb=new RuleBundle();       //, 规则集合
    display=true;                      //,是否显示，用于remove规则标志节点 区分显示

}

export {Node}