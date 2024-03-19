import {Node} from "@/backend/v7/common/entity/Node";
import {relativePath, rootName} from "@/backend/v7/common/util/util";
import {IterateBaseProcessor} from "@/backend/v7/common/service/tree/iterator/processor/IterateBaseProcessor";
import {FILE_TYPE} from "@/backend/v7/common/config/Constant";

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


    /**
     * 执行遍历
     * @param mode       模式
     * @param arg           附加参数【必要参数SEARCH：arg.path查找全路径】【ADD：arg.path添加相对路径】
     */
    execute(mode=ITERATE_MODE.ALL, arg={processor:this.processor}){
        switch (this.mode) {
            case ITERATE_MODE.ALL:return this.traversal(this.root,arg);
            case ITERATE_MODE.SEARCH:return this.search(arg.path,this.root,arg);
            case ITERATE_MODE.ADD:return this.add(arg.path,this.root,arg);
        }
    }

    //. 遍历所有树节点
    traversal(rootNode=new Node(),arg){
        for(let child of rootNode.children.slice()){
            (arg.processor||this.processor).onNode(child,true,rootNode);
            if(child.children.length>0){
                this.traversal(child,arg);
            }
        }
    }

    //. 根据路径查找节点
    search(path,rootNode=new Node(),arg){
        let rootDir=rootName(path);
        let onPath;
        let matchNode;
        for(let child of rootNode.children.slice()){
            onPath=child.name===rootDir;
            (arg.processor||this.processor).onNode(child,onPath,rootNode,arg);
            if(onPath){
                matchNode=child;
                if(child.children.length>0){
                    this.search(relativePath(path),child,arg);
                }
                break;
            }
        }
        if(onPath){
            return (arg.processor||this.processor).onMatch(matchNode,rootNode,arg);
        }else{
            return (arg.processor||this.processor).onMiss(rootNode,path,arg);
        }
    }

    //. 添加节点
    add(path,rootNode=new Node(),arg){
        let rootDir=rootName(path);
        let relative=relativePath(path);
        let childNode=rootNode.children.find(n=>n.name===rootDir);
        if(!childNode){
            childNode=(arg.processor||this.processor).onAdd(rootNode,rootDir,relative,arg);
            rootNode.children.push(childNode);
        }
        if(rootDir===path)return childNode;
        return this.add(relative,childNode,arg);
    }

}

export {
    TreeIterator,
    ITERATE_MODE
}