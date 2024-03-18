import {Node} from "@/backend/v7/common/entity/Node";
import {IterateBaseProcessor} from "@/backend/v7/common/service/tree/iterator/processor/IterateBaseProcessor";

//% 遍历节点处理器
class FileDiffIterateProcessor extends IterateBaseProcessor{

    parentNode=new Node();
    idx=0;
    seq;

    constructor(seq) {
        super();
        this.seq=seq;
    }


    //. 迭代器迭代过程中发现新增的节点版本（非源节点）的顺便剪枝
    onNode(node = new Node(), onPath = false, parent = new Node()) {
        if(this.parentNode!==parent){                           //新一层重置索引
            this.idx=0;
        }
        if(!onPath){                                                          //非当前查询路径中的节点
            if(!node.origin&&node.seq!==this.seq){      //规则版本与指定版本不一致
                parent.children.splice(this.idx,1);
            }else{
                this.idx++;
            }
        }
    }

    //. 未命中
    onMiss(parent = new Node(), path) {
        return {
            relative:path,
            leaf:parent,
            match:false,
            parent:parent.parent
        }
    }

    //. 命中
    onMatch(node = new Node(), parent = new Node()) {
        return {
            leaf:node,
            match:true,
            parent
        }
    }

    //.构建节点
    buildNode(parent = new Node(), name, relativePath) {

    }

    //.设置节点版本
    updateSeq(node=new Node()){
        if(node.parent&&(!node.parent.origin)){
            if(node.parent.seq!==node.seq){     //, 父节点版本跟当前不一，则清空规则
                node.parent.rb.clear();
            }
            node.parent.seq=node.seq;
            this.updateSeq(node.parent);
        }
    }

}

export {FileDiffIterateProcessor}