import {NodeBuilder} from "@/backend/v5/common/service/builder/NodeBuilder";
import {Node} from "@/backend/v5/common/entity/Node";

class RemoveNodeBuilder extends NodeBuilder{

    constructor(trees=new Node(),seq=new Date().getTime()){
        super(trees,seq);
    }

    buildRelate(baseNode = new Node(), checkRuleList = [], inheritRuleList = []) {

    }



}