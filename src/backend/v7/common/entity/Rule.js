import {MATCH_MODE} from "@/backend/v7/common/config/configCenter";
import {formatPath} from "@/backend/v7/common/util/util";
import {Node} from "@/backend/v5/common/entity/Node";

class Rule {
    config;                                         //, configCenter.RULE_CONFIG
    testWholePath=false;                //,

    test(node = new Node()) {
        if (!node.path.startsWith(this.base)) {
            return false;
        }
        if (this.type === MATCH_MODE.REGEX && (!new RegExp(this.relative).test((this.testWholePath ? node.path : node.path.replace(this.base, ''))))) {
            return false;
        }
        if (this.type === MATCH_MODE.MATCH && formatPath(this.base, this.relative || '') !== node.path) {
            return false;
        }
        if (!this.recursionZip && node.inZip) {
            return false;
        }
    }

    //. 对应目标节点
    mapping(node=new Node()){

    }
}

export {Rule}