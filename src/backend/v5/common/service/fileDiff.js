import {RuleBundle} from "@/backend/v5/common/entity/RuleBundle";
import {Node} from "@/backend/v5/common/entity/Node";
import {FILE_TYPE} from "@/backend/v5/common/constant/Constant";


let configs=[
    //文件夹
    {source:'D:/Test/base',target:'D:/Test/compared/a.zip',relative:'*.jpg',type:'regex',mode:'zip',},
    {source:'D:/Test/base',target:'D:/Test/compared',relative:'*.txt',type:'regex',testWholePath:false,mode:'increment',targetBase:'xx'},
    //文件
    {source:'D:/Test/base/1.png',target:'D:/Test/compared/1.png',type:'match',testWholePath:false,mode:'increment'},


    {
        source:'D:/Test/base',
        target:[
            {
                path:'D:/Test/compared',
                rules:[
                    {mode:''},
                    {mode:'cover',path:'1.jpg',matchType:'match',},
                    {mode:'cover',path:'*.jpg',matchType:'regex',}
                ]
            },
            {
                path:'D:/Test/base',
                rules:[
                    {mode:'cover',path:'1.jpg',matchType:'match',},
                    {mode:'cover',path:'*.jpg',matchType:'regex',}
                ]
            }
        ]


    }
];

class TransportTreeProcessor{
    onMatch(){

    }
}
class CompareTreeProcessor{
    tree;

    children(){

    }
    onMatch(nodeRule,baseNode,parentNode,base,pb){
        let targetPath=nodeRule.rule.mapping(baseNode);
        let nearestNode=findNearestNode(this.tree,targetPath);
        if(nearestNode) {
            if (nearestNode.path === targetPath) {
                //, merge
                nearestNode.type=FILE_TYPE.DIRECTORY&&baseNode.type===FILE_TYPE.ZIP?FILE_TYPE.ZIP:nearestNode.type;
            } else {
                let relativePath = targetPath.replace(nearestNode.path, '');
                let {root,leaf,parent} = treeByPath(relativePath, baseNode.type);
                nearestNode.child(root);
            }
        }else{
            let {root,leaf,parent}=treeByPath(targetPath,baseNode.type);
            this.tree=root;
        }
    }

}

function trees(pb,rules=new RuleBundle(),processor,parentNode){
    let children=processor.children(pb,rules,parentNode);
    if(!children)return;
    for(let base of children){
        let baseNode=new Node().from(base);
        let matchRules=rules.check(base);
        for(let nodeRule of matchRules.get()){
            let targetPath=nodeRule.rule.mapping(baseNode);  //, 获得映射目的（默认为baseNode路径）
            let pns=processor.onMatch(nodeRule,baseNode,parentNode,base,pb);
            if(pns){
                baseNode.pns=pns;
            }else{

            }
        }
        if(parentNode) {
            for (let pn of parentNode.pns) {

            }
        }

        trees(base,rules,processor,baseNode);
    }
}



function findNearestNode(tree,path){
    if(tree.path===path)return tree;
    for(let node of tree){
        if(path===node.path)return node;
        if(path.startsWith(node.path))return findNearestNode(node,path);
    }
    return path.startsWith(tree.path)?tree:null;
}




//. 根据路径构建树
function treeByPath(path,leafType){                                                             //, path:路径，leafType:路径结尾文件类型
    let root;
    let parent=null,leaf=null;
    let start=0,end=0;
    path=path+'/';

    while((end=path.indexOf('/',start))>0){
        if(parent){
            parent.child(leaf);
            leaf.pns=(leaf===root?[]:[parent]);
            parent=leaf;
        }
        leaf=new Node(path.substring(start,end),path.substring(0,end),1);
        if(!root)root=leaf;
        if(!parent)parent=new Node();
        start=end+1;
    }
    if(parent){
        parent.child(leaf);
        leaf.pns.push(parent);
    }
    leaf.type=leafType;
    return {root,leaf,parent};
}



function tree(pb,rules=new RuleBundle(),processor,parentNode){
    let children=processor.children(pb);
    if(!children||children.length===0)return;
    for(let base of children){
        let baseNode=new Node().from(base);
        let matchRules=rules.check(baseNode);
        baseNode.relates=processor.buildRelate(matchRules,parentNode);
        tree(base,rules,processor,baseNode);
    }
}

