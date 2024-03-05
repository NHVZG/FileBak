import {Node} from "@/backend/v5/common/entity/Node";
import {relativePath, rootName,formatPath} from "@/backend/v5/common/util/util";
import {FILE_TYPE} from "@/backend/v5/common/constant/Constant";
import {RULE_CONFIGS} from "@/backend/v5/common/entity/Rule";
import {RuleBundleItem} from "@/backend/v5/common/entity/RuleBundleItem";

class NodeBuilder{
    /**
     * , 1. trees按照原目标树为基底 源树映射节点直接在目标树上 添加，删除（标记）
     * , 2. trees可能多次修改，需要记录版本号seq
     * , 3. 遍历节点时判断残留非本次版本的删除（不一定删除干净，仅仅减少无效节点）
     * , 4. 树遍历时需要判断标记
     * , 5. 规则仅仅作用于原节点，不作用于上一个规则新增的节点
     */
    trees=new Node();
    seq;

    constructor(trees=new Node(),seq=new Date().getTime()) {
        this.trees=trees;
        this.seq=seq;
    }


    buildRelate(baseNode=new Node(),checkRuleList=[],inheritRuleList=[]){
        checkRuleList.map(r=>{
            //, 目标树
            let targetPath=r.mapping(baseNode);
            let {relative,leaf,match,parent}=this.findNearestNode(targetPath);
            if(match){
                leaf.seq=this.seq;
                if(r.mode===RULE_CONFIGS.remove){//, 隐藏目标节点
                    leaf.display=false;
                }
            }else{
                leaf=this.appendNode(relative,leaf,r.zip,false);
            }
            let rbi=new RuleBundleItem();
            rbi.source=baseNode;
            rbi.generation=0;
            rbi.target=leaf;
            rbi.match=leaf;
            rbi.rule=r;
            leaf.rules.append(rbi);
            //, 源树
            if(!baseNode.relates.includes(leaf)){
                baseNode.relates.push(leaf);
            }
            baseNode.rules.append(rbi);
        });



    }

    appendNode(path,leaf,zip=false,origin=false){
        let root=rootName(path);
        if(root===path){
            let child=new Node(formatPath(leaf.path,path),zip?FILE_TYPE.ZIP:FILE_TYPE.FILE,leaf.type===FILE_TYPE.ZIP||leaf.inZip,origin,true,this.seq);
            leaf.children.push(child);
            return child;
        }else{
            let child=new Node(formatPath(leaf.path,root),FILE_TYPE.DIRECTORY,leaf.type===FILE_TYPE.ZIP||leaf.inZip,origin,true,this.seq);
            leaf.children.push(child);
            return this.appendNode(relativePath(leaf.path),child,zip);
        }
    }

    findNearestNode(path='',parent=new Node()){
        parent=!parent?this.trees:parent;
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

export {NodeBuilder}