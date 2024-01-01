class Node{
    name;
    path;
    type;
    inZip;
    children=[];
    rules;
    pns=[];

    constructor(name, path) {
        this.name = name;
        this.path = path;
    }

    //.添加子节点
    child(node){

    }

    from(base){

        return this;
    }
}

export {Node}