import {Node} from "@/backend/v7/common/entity/Node";
import {Rule} from "@/backend/v7/common/entity/Rule";

class BaseProcessor {

    //处理源节点
    process(baseNode=new Node(),rule=new Rule()){

    }

    /**
     * 构建目标节点 返回Node对象（如果映射到目标树，否则返回空） 不操作树结构
     * @param baseNode      源节点
     * @param rule                 规则
     * @param targetNode    目的节点
     */
    buildTarget(baseNode=new Node(),rule=new Rule(),targetNode){

    }

}


export {BaseProcessor}
