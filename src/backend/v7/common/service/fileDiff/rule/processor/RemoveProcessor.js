import {BaseProcessor,ACTION} from "@/backend/v7/common/service/fileDiff/rule/processor/BaseProcessor";
import {Node} from "@/backend/v7/common/entity/Node";
import {RULE_CONFIG} from "@/backend/v7/common/config/configCenter";
import {RuleBundle} from "@/backend/v7/common/entity/RuleBundle";
import {Rule} from "@/backend/v7/common/entity/Rule";
import {RuleBundleItem} from "@/backend/v7/common/entity/RuleBundleItem";

//% 删除规则
class RemoveProcessor extends BaseProcessor{

    process(baseNode = new Node(), rule = new Rule()) {
        let rbi=new RuleBundleItem(rule,baseNode);
        baseNode.rb.append(rbi);
        return rbi;
    }

    buildTarget(baseNode = new Node(), rule = new Rule(), targetNode) {
        return {action:ACTION.REMOVE};
    }
}

export {RemoveProcessor}