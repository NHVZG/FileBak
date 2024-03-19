import {IterateBaseProcessor} from "@/backend/v7/common/service/tree/iterator/processor/IterateBaseProcessor";
import {Node} from "@/backend/v7/common/entity/Node";

//% FileDiff遍历节点处理器【删除节点】
class FileDiffRemoveIterateProcessor  extends IterateBaseProcessor{

    parentNode=new Node();
    idx=0;
    seq;

    constructor(seq){
        super();
        this.seq=seq;
    }


    onNode(node = new Node(), onPath = false, parent = new Node()) {
        if(this.parentNode!==parent){                           //新一层重置索引
            this.idx=0;
        }else{
            this.idx++;
        }
    }

    onMatch(node = new Node(), parent = new Node(), arg) {
        if(!node.origin){//非源节点
            parent.splice(this.idx,1);
        }
    }


}

export {FileDiffRemoveIterateProcessor}