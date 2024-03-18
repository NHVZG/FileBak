import {Node} from "@/backend/v7/common/entity/Node";
import {rootName} from "@/backend/v7/common/util/util";
import {IterateBaseProcessor} from "@/backend/v7/common/service/tree/iterator/processor/IterateBaseProcessor";


class TreeIterator{
    root;
    processor=new IterateBaseProcessor();

    constructor(root=new Node(),processor=new IterateBaseProcessor()) {
        this.root=root;
        this.processor=processor;
    }


    execute(path,){




    }

    iterate(path,rootNode=new Node()){
        let rootDir=rootName(path);
        let idx=0;
        for(let child of rootNode.children.slice()){
            let onPath=child.name===rootDir;
            this.processor.onNode(child,onPath,rootNode,idx);
            if(onPath)break;
        }

    }



}