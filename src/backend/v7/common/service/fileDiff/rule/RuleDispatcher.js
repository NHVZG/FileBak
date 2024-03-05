import {DISPATCH_CONFIG} from "@/backend/v7/common/config/configCenter";
import {Node} from "@/backend/v7/common/entity/Node";

class RuleDispatcher{

    tree;

    dispatch(baseNode=new Node(),checkRules=[],inheritRules=[]){


        checkRules.map(rule=>{
            let processor=new DISPATCH_CONFIG[rule.config]();
            processor.process(baseNode,rule);
            let targetNode=processor.buildTarget(baseNode);
        });

        inheritRules.map(rule=>{

        });




    }
}

export {RuleDispatcher}