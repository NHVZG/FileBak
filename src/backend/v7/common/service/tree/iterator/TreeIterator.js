import {Node} from "@/backend/v7/common/entity/Node";
import {relativePath, rootName} from "@/backend/v7/common/util/util";
import {IterateBaseProcessor} from "@/backend/v7/common/service/tree/iterator/processor/IterateBaseProcessor";


const ITERATE_MODE=Object.freeze({
    ALL:1,
    SEARCH:2,
    ADD:3
});

class TreeIterator{
    root;
    processor=new IterateBaseProcessor();
    mode=ITERATE_MODE.ALL;

    constructor(root=new Node(),processor=new IterateBaseProcessor()) {
        this.root=root;
        this.processor=processor;
    }


    execute(mode=ITERATE_MODE.ALL,path){
        switch (this.mode) {
            case ITERATE_MODE.ALL:return this.traversal(this.root);
            case ITERATE_MODE.SEARCH:return this.search(path,this.root);
            case ITERATE_MODE.ADD:return this.add(path,this.root);
        }
    }

    //. 遍历所有树节点
    traversal(rootNode=new Node()){
        for(let child of rootNode.children.slice()){
            this.processor.onNode(child,true,rootNode);
            if(child.children.length>0){
                this.traversal(child);
            }
        }
    }

    //. 根据路径查找节点
    search(path,rootNode=new Node()){
        let rootDir=rootName(path);
        let onPath;
        let matchNode;
        for(let child of rootNode.children.slice()){
            onPath=child.name===rootDir;
            this.processor.onNode(child,onPath,rootNode);
            if(onPath){
                matchNode=child;
                if(child.children.length>0){
                    this.search(relativePath(path),child);
                }
                break;
            }
        }
        if(onPath){
            return this.processor.onMatch(matchNode,rootNode);
        }else{
            return this.processor.onMiss(rootNode,path);
        }
    }

    //. 添加节点
    add(path,rootNode=new Node()){
        let rootDir=rootName(path);
        let relative=relativePath(path);
        let childNode=rootNode.children.find(n=>n.name===rootDir);
        if(!childNode){
            childNode=this.processor.buildNode(rootNode,rootDir,relative);
            rootNode.children.push(childNode);
        }
        if(rootDir===path)return childNode;
        return this.add(relative,childNode);
    }

}

export {
    TreeIterator,
    ITERATE_MODE
}