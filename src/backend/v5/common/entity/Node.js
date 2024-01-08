class Node{
    name;
    path;
    type;
    inZip;
    children=[];
    rules;
    relates=[];

    constructor(name, path,type) {
        this.name = name;
        this.path = path;
        this.type = type;
    }

    //.添加子节点
    child(node){

    }

    from(base){

        return this;
    }
}

export {Node}