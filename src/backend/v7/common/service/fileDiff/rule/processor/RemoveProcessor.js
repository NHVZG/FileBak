import {BaseProcessor} from "@/backend/v7/common/service/fileDiff/rule/processor/BaseProcessor";
import {Node} from "@/backend/v7/common/entity/Node";
import {RULE_CONFIG} from "@/backend/v7/common/config/configCenter";
import {RuleBundle} from "@/backend/v7/common/entity/RuleBundle";

//% 删除规则
class RemoveProcessor extends BaseProcessor{
    process(baseNode = new Node(), rule = new Rule()) {
        let rb=new RuleBundle();
        rb.

    }

    buildTarget(baseNode = new Node(), rule = new Rule(), targetNode) {
        return null;
    }
}

export {RemoveProcessor}