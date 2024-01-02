
function treeByPath(path,leafType){                                                             //, path:路径，leafType:路径结尾文件类型
    let root;
    let parent=null,leaf=null;
    let start=0,end=0;
    path=path+'/';

    while((end=path.indexOf('/',start))>0){
        if(parent){
            parent.children.push(leaf);
            leaf.pns=(leaf===root?[]:[parent]);
            parent=leaf;
        }
        leaf={name:path.substring(start,end),path:path.substring(0,end),type:1,children:[],pns:[]};
        if(!root)root=leaf;
        if(!parent)parent= {children:[]};
        start=end+1;
    }
    if(parent){
        parent.children.push(leaf);
        leaf.pns.push(parent);
    }
    leaf.type=leafType;
    return {root,leaf,parent};
}

let {root,leaf,parent}=treeByPath('D:/A/B/C');
console.log(123);