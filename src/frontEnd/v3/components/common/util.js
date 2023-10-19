//` list转map
function list2map(list,...keys){
    return list?list.reduce((o,n)=>{
        let a=n;
        for(let k of keys){
            a=a[k];
        }
        return {...o,[a]:n};
        //return {...o,[n[key]]:n};
    },{}):{};
}


function findLastParent(bsid,separator,map,childKey,valueKey){
    let keys=bsid.split(separator);
    if(!map)return null;
    let sub=map;
    let last=null;
    for(let key of keys){
        if(!sub[key]){
            return valueKey?last[valueKey]:last;
        }
        last=sub[key];
        sub=childKey?sub[key][childKey]:sub[key];
    }
    return valueKey?last[valueKey]:last;
}

//` 遍历树
function recursiveTree(node,key,func,pNode,pVal){
    let curVal=func(node,pNode,pVal);
    if(!node[key])return;
    node[key].map(n => {
        recursiveTree(n, key,func,node,curVal);
    });
}

function recursiveTreeMap(map,childKey,func,pEntry,pVal){
    for(let entry of Object.entries(map)){
        let key=entry[0];
        let value=entry[1];
        let curVal=func(key,value,pEntry,pVal);
        if(map[childKey]){
            recursiveTreeMap(map[childKey],childKey,func,entry,curVal);
        }
    }
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
    if(!map)return null;
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
    findLastParent,
    recursiveTreeMap,
    elTreeParent,
    treeLeaf,
    treeMap,
    list2map,
    recursiveTree
}