import {RuleBundle} from "@/backend/v5/common/entity/RuleBundle";

class Node{
    name;
    path;
    type;
    inZip;
    children=[];
    rules=new RuleBundle();
    relates=[];

    constructor(name, path,type) {
        this.name = name;
        this.path = path;
        this.type = type;
    }

    //.添加子节点
    child(node){
        if(node instanceof Array){
            this.children=this.children.concat(node);
        }else{
            this.children.push(node);
        }
    }

    //. 根据名称查找子节点
    findByName(name){
        return this.children.find(n=>n.name===name);
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