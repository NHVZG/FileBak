import {Node} from "@/backend/v6/common/entity/Node";
import * as Util from "@/backend/v6/common/util/util";

const RULE_CONFIGS = Object.freeze({
    except: new Symbol({inherit: true, penetrate: true, order: 1}),                      //例外 - 穿透 覆盖其他规则
    remove: new Symbol({inherit: true, penetrate: true, order: 2}),                     //删除 - 对远程路径操作
    //. 互斥规则
    update: new Symbol({inherit: true, penetrate: false, order: 10}),                   //更新 - 仅覆盖已有
    increment: new Symbol({inherit: true, penetrate: false, order: 11}),              //新增 - 仅新增文件
    incrementUpdate: new Symbol({inherit: true, penetrate: false, order: 12}),   //更新+新增 - 两种模式的混合
    cover: new Symbol({inherit: true, penetrate: false, order: 13}),                     //覆盖 - 完全与源文件路径一致，删除不在受控内的文件
});

const MATCH_MODE = Object.freeze({
    REGEX: new Symbol("regex"),
    MATCH: new Symbol("match"),
});

class Rule {
    mode;                     //,规则类型
    base;                       //, 源基础路径
    relative;                   //, 源相对路径
    type;                       //, 匹配方式
    testWholePath;       //, 整个路径作为匹配参数
    target;                    //, 映射目的路径（默认=base）
    baseTarget;             //, target是否有基础路径，true则映射路径=target+文件相对路径，false则映射路径=target
    zip;                         //, 是否打包为zip
    recursionZip;           //, 遍历zip文件

    //. 测试规则
    test(node = new Node()) {
        if (!node.path.startsWith(this.base)) {
            return false;
        }
        if (this.type === MATCH_MODE.REGEX && (!new RegExp(this.relative).test((this.testWholePath ? node.path : node.path.replace(this.base, ''))))) {
            return false;
        }
        if (this.type === MATCH_MODE.MATCH && this.format(this.base, this.relative || '') !== node.path) {
            return false;
        }
        if (!this.recursionZip && node.inZip) {
            return false;
        }
    }

    //. 可否继承
    inheritable(node=new Node()){
        if(node.inZip&&(!this.recursionZip)){
            return false;
        }
        let conf=RULE_CONFIGS[this.mode];
        return conf.inherit||conf.penetrate;
    }

    //. 映射地址
    mapping(node){
        if(!this.test(node))return '';
        return this.baseTarget?
            Util.formatPath(this.target,node.path.replace(this.base,'')):
            this.target||node.path;
    }
}

export {
    Rule,
    RULE_CONFIGS,
    MATCH_MODE
}