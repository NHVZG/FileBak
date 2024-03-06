import {DISPATCH_CONFIG} from "@/backend/v7/common/config/configCenter";
import {Node} from "@/backend/v7/common/entity/Node";
import {relativePath,rootName} from "@/backend/v7/common/util/util";

class RuleDispatcher{

    tree;

    dispatch(baseNode=new Node(),checkRules=[],inheritRules=[]){


        checkRules.map(rule=>{
            let processor=new DISPATCH_CONFIG[rule.config]();
            processor.process(baseNode,rule);
            let targetNode=processor.buildTarget(baseNode);
        });

        inheritRules.map(rule=>{

        });




    }

    findNearestNode(path='',parent=new Node()){
        parent=!parent?this.tree:parent;
        let rootDir=rootName(path);
        let childNode;

        let idx=0;
        for(let n of parent.children.slice()){
            if(n.name===rootDir){               //, 查找到对应节点
                childNode=n;
                break;
            }
            if(!n.origin&&n.seq!==this.seq){                   //, 遍历过程发现非本此版本的顺便删除
                parent.children.splice(idx,1);
            }else {
                idx++;
            }
        }

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

export {RuleDispatcher}