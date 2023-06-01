//` list转map
function list2map(list,key){
    return list?list.reduce((o,n)=>({...o,[n[key]]:n}),{}):{};
}

//` 遍历树
function recursiveTree(node,key,func){
    func(node);
    if(!node[key])return;
    node[key].map(n => {
        recursiveTree(n, key,func);
    });
}


export {
    list2map,
    recursiveTree
}