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
     * @param arg              附加参数
     */
    onMatch(node=new Node(),parent=new Node(),arg){

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
    onAdd(parent=new Node(),name,relativePath){

    }

    /**
     * 设置节点版本
     */
    updateSeq(node=new Node()) {
        if (!node.parent) return;
        if (node.parent.seq !== node.seq) {//, 父节点版本跟当前不一，则清空规则，源节点则删除版本
            node.parent.rb.clear();
            if (node.parent.origin) {
                delete node.parent.seq;
            } else {
                node.parent.seq = node.seq;
            }
        }
        this.updateSeq(node.parent);
    }

}

export {IterateBaseProcessor}