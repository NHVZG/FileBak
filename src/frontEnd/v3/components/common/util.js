//` list转map
function list2map(list,key){
    return list?list.reduce((o,n)=>({...o,[n[key]]:n}),{}):{};
}

//` 遍历树
function recursiveTree(node,key,func,pNode,pVal){
    let curVal=func(node,pNode,pVal);
    if(!node[key])return;
    node[key].map(n => {
        recursiveTree(n, key,func,node,curVal);
    });
}

//` 树形map
function treeMap(bsid,value,separator,map,childKey,valueKey){
    let keys=bsid.split(separator);
    map=map?map:{};
    let sub=map;
    let leaf;
    let k;
    for(let key of keys){
        if(!sub[key]){
            sub[key]={};
        }
        if(childKey&&(!sub[key][childKey])){
            sub[key][childKey]={};
        }
        leaf=sub[key];
        sub=childKey?sub[key][childKey]:sub[key];
        k=key;
    }
    if(valueKey){
        leaf[valueKey]=value;
        if(Object.keys(leaf[childKey]).length===0)delete leaf[childKey];
    }else{
        Object.keys(value).map(k=>leaf[k]=value[k]);
    }
    return map;
}

//` 获得树形map叶子节点
function treeLeaf(bsid,separator,map,childKey,valueKey){
    let keys=bsid.split(separator);
    let o=map;
    let finalNode;
    for(let key of keys){
        let node=o[key];
        //if(!node)break;
        if(!node)return false;
        finalNode=node;
        o=childKey?(node[childKey]?node[childKey]:node):node;
    }
    if(!finalNode)return null;
    return valueKey?finalNode[valueKey]:finalNode;

}

//` el-tree查找父节点
function elTreeParent(node,func){
    let p=node.parent
    while(p&&(!func(p))){
        p=p.parent;
    }
    return p;
}


export {
    elTreeParent,
    treeLeaf,
    treeMap,
    list2map,
    recursiveTree
}