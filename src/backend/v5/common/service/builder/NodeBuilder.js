import {Node} from "@/backend/v5/common/entity/Node";
import {relativePath, rootName,formatPath} from "@/backend/v5/common/util/util";


class NodeBuilder{
    trees=new Node();

    constructor(trees=new Node()) {
        this.trees=trees;
    }


    buildRelate(baseNode=new Node(),checkRuleList=[],inheritRuleList=[]){
        checkRuleList.map(r=>{
            let target=r.mapping(baseNode);
            let {path,leaf,match,parent}=this.findNearestNode(target);
            //f(leaf===)

            if(target!==baseNode.path){

            }
        });
    }

    appendNode(path,leaf,zip=false){
        let root=rootName(path);
        if(root===path){
            
        }else{

        }
        formatPath(leaf.path,)
        leaf.children.push(new Node(path));
    }

    findNearestNode(path='',parent=new Node()){
        parent=!parent?this.trees:parent;
        let rootDir=rootName(path);
        let childNode=parent.children.find(n=>n.name===rootDir);
        if(childNode&&childNode.children&&childNode.children.length>0){
            return this.findNearestNode(relativePath(path),childNode);
        }else{
            return {
                path,
                leaf:childNode||parent,
                match:childNode!==undefined&&childNode!=null,
                parent:parent
            }
        }
    }
}

export {NodeBuilder}