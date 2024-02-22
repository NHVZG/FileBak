import {baseName} from "@/backend/v5/common/util/util";

class Node{
    name;                           //, 文件名
    path;                             //, 文件路径
    type;                             //, 文件类型
    inZip;                            //, 是否在zip中
    children=[];                  //, 子节点

    relates=[];                     //, 关联节点
    origin;                           //,是否源节点（用于区分映射后添加的节点）
    display=true;                //, 是否显示（origin=true用于标识时是否显示）

    constructor(path,type,inZip) {
        this.name=baseName(path);
        this.path=path;
        this.type=type;
        this.inZip=inZip;
    }

}

export {Node}