import {Node} from "@/backend/v5/common/entity/Node";
import {relativePath, rootName,formatPath} from "@/backend/v5/common/util/util";
import {FILE_TYPE} from "@/backend/v5/common/constant/Constant";

class NodeBuilder{
    /**
     * , 1. trees按照原目标树为基底 源树映射节点直接在目标树上 添加，删除（标记）
     * , 2. trees可能多次修改，需要记录版本号seq
     */
    trees=new Node();
    seq=new Date().getTime();

    constructor(trees=new Node(),seq=new Date().getTime()) {
        this.trees=trees;
        this.seq=seq;
    }


    buildRelate(baseNode=new Node(),checkRuleList=[],inheritRuleList=[]){
        checkRuleList.map(r=>{
            let targetPath=r.mapping(baseNode);
            let {relative,leaf,match,parent}=this.findNearestNode(targetPath);
            if(!match){
                this.appendNode(relative,leaf,r.zip);
            }

            if(targetPath!==baseNode.path){

            }
        });
    }

    appendNode(path,leaf,zip=false){
        let root=rootName(path);
        if(root===path){
            let child=new Node(formatPath(leaf.path,path),zip?FILE_TYPE.ZIP:FILE_TYPE.FILE,leaf.type===FILE_TYPE.ZIP||leaf.inZip);
            leaf.children.push(child);
        }else{
            let child=new Node(formatPath(leaf.path,root),FILE_TYPE.DIRECTORY,leaf.type===FILE_TYPE.ZIP||leaf.inZip);
            leaf.children.push(child);
            return this.appendNode(relativePath(leaf.path),child,zip);
        }
    }

    findNearestNode(path='',parent=new Node()){
        parent=!parent?this.trees:parent;
        let rootDir=rootName(path);
        let childNode=parent.children.find(n=>n.name===rootDir);
        if(childNode&&childNode.children&&childNode.children.length>0){
            return this.findNearestNode(relativePath(path),childNode);
        }else{
            return {
                relative:path,
                leaf:childNode||parent,
                match:childNode!==undefined&&childNode!=null,
                parent:parent
            }
        }
    }
}

export {NodeBuilder}