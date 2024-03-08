import {ACTION, BaseProcessor} from "@/backend/v7/common/service/fileDiff/rule/processor/BaseProcessor";


class CoverProcessor extends BaseProcessor{


    buildTarget(baseNode = new Node(), rbi = new RuleBundleItem(), inherit = false, targetNode) {
        return {
            action:ACTION.ADD
        }
    }
}

export {CoverProcessor}