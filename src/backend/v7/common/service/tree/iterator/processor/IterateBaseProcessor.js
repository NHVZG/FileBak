import {Node} from "@/backend/v7/common/entity/Node";

class IterateBaseProcessor{

    /**
     * 【ALL,SEARCH】
     * 遍历节点回调
     * @param node      节点
     * @param onPath   是否在遍历路径上（指定索引路径时用）
     * @param parent   父节点
     */
    onNode(node=new Node(),onPath=false,parent=new Node()){

    }

    /**
     * 【SEARCH】
     * 指定索引路径时匹配到指定路径
     * @param node          节点
     * @param parent        父节点
     */
    onMatch(node=new Node(),parent=new Node()){

    }

    /**
     * 【SEARCH】
     * 指定索引路径时不能匹配到指定路径
     * @param parent        父节点
     * @param path           查找节点与parent相对路径
     */
    onMiss(parent=new Node(),path){

    }

    /**
     * 【ADD】
     * 添加节点时构建方法
     * @param parent
     * @param name
     * @param relativePath
     */
    buildNode(parent=new Node(),name,relativePath){

    }

}

export {IterateBaseProcessor}