import {Node} from "@/backend/v5/common/entity/Node";

//. 格式化路径
function formatPath(...filePaths){
    return filePaths.join('/').replaceAll(/\/+/gm, '/').replaceAll(/\/$/gm,'');
}

//. 根据路径查找树节点
function findPathNode(tree=new Node(),filePath){
    let relativePath=formatPath(filePath)+'/';
    let start=0,end=0;

    let pNode=new Node();
    pNode.children=[tree];

    let parentNode=null;
    while((end=relativePath.indexOf('/',start))>0){
        let name=relativePath.substring(start,end);
        let child=pNode.children.find(n=>n.name===name);
        if(!child){
            return {leaf:parentNode,match:null,parent:parentNode};
        }
        if(child&&end===relativePath+1){
            return {leaf:child,match:child,parent:parentNode}
        }
        parentNode=pNode;
        pNode=child;
        start=end+1;
    }
    return {leaf: null,match:null,parent:null};
}

//. 根据路径创建树
function buildPathNode(filePath,leafType,tree){
    filePath=formatPath(filePath);
    let parent;
    let root;
    if(tree){
        let res=findPathNode(tree,filePath);
        if(res.leaf.path===filePath){
            res.leaf.type=leafType;
            if(!(res.leaf.relates||[]).some(n=>n===res.leaf)){
                res.leaf.relates=res.leaf.relates||[];
                res.leaf.relates.push(res.leaf);
            }
            return {root:tree,leaf:res.leaf,parent:res.parent};
        }
        filePath=filePath.replace(res.leaf.path+'/','');
        parent=res.leaf;
        root=tree;
    }
    let start=0,end=0;
    filePath=filePath+'/';
    let leaf;
    while((end=filePath.indexOf('/'))>0){
        let node=new Node(filePath.substring(start,end),filePath.substring(0,end),1);
        leaf=node;
        leaf.relates=[leaf];
        if(!root)root=node;
        if(parent){
            parent.children.push(node);
            parent=node;
        }else{
            parent=root;
        }
    }
    leaf.type=leafType;
    return {root,leaf,parent};
}



export {
    formatPath,
    findPathNode,
    buildPathNode
}