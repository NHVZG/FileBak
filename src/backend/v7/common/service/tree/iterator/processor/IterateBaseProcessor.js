import {Node} from "@/backend/v7/common/entity/Node";

class IterateBaseProcessor{

    /**
     * 遍历节点回调
     * @param node      节点
     * @param onPath   是否在遍历路径上（指定索引路径时用）
     * @param parent   父节点
     * @param idx        节点处于父节点的位置
     * @return idx         返回遍历索引
     */
    onNode(node=new Node(),onPath=false,parent=new Node(),idx=0){

    }

    /**
     * 指定索引路径时匹配到指定路径
     * @param node          节点
     * @param parent        父节点
     */
    onMatch(node=new Node(),parent=new Node()){

    }

    /**
     * 指定索引路径时不能匹配到指定路径
     * @param parent        父节点
     */
    onMiss(parent=new Node()){

    }

}

export {IterateBaseProcessor}