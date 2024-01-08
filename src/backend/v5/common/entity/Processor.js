import {findPathNode,buildPathNode} from "@/backend/v5/common/util/Util";
import {TreeNodeGenerator} from "@/backend/v5/common/entity/generator/TreeNodeGenerator";


class Processor{
    childGenerator=new TreeNodeGenerator();
    constructor(childGenerator=new TreeNodeGenerator()) {
        this.childGenerator=childGenerator;
    }
    children(pb){
        return this.childGenerator.children(pb);
    }

    buildRelates(matchRules,parentNode){
        return [];
    }


}

export {
    Processor,
}