
class Node {
    name;                           //, 文件名
    path;                             //, 文件路径
    type;                             //, 文件类型
    inZip;                            //, 是否在zip中
    children=[];                  //, 子节点

    relates=[];                     //, 关联节点

    constructor(name,path,type) {
        this.name=name;
        this.path=path;
        this.type=type;
    }

    //.添加子节点
    child(node){
        if(node instanceof Array){
            this.children=this.children.concat(node);
        }else{
            this.children.push(node);
        }
    }

    //. 从配置构建Node对象
    from(base={}){
        this.name=base.name;
        this.inZip=base.inZip;
        this.rules=base.rules;
        this.path=base.path;
        this.type=base.type;
        this.relates=[];
        return this;
    }
}

export {Node}