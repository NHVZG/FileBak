import {Node} from "@/backend/v7/common/entity/Node";
import {Rule} from "@/backend/v7/common/entity/Rule";
import {RuleBundleItem} from "@/backend/v7/common/entity/RuleBundleItem";

class BaseProcessor {

    /**
     *  校验规则是否匹配节点
      * @param baseNode     匹配节点
     * @param rule                规则
     * @param inherit           规则来源是否继承
     */
    match(baseNode=new Node(),rule=new Rule(),inherit=false){
        return rule.test(baseNode);
    }

    /**
     * 处理源节点
     * @param baseNode              源节点
     * @param rule                         规则
     * @param inherit                    规则来源是否继承
     * @return RuleBundleItem    返回处理后的规则集合项
     */
    process(baseNode=new Node(),rule=new Rule(),inherit=false){

    }

    /**
     * 构建目标节点 返回Node对象（如果映射到目标树，否则返回空） 不操作树结构
     * @param baseNode              源节点
     * @param rbi                           规则
     * @param targetNode            目的节点
     * @param inherit                    规则来源是否继承
     * @return {action:ACTION,node} 返回节点操作类型
     */
    buildTarget(baseNode=new Node(),rbi=new RuleBundleItem(),inherit=false,targetNode){

    }

}

const ACTION=Object.freeze({
   NOTHING:0,
   ADD:1,
   REMOVE:2
});


export {BaseProcessor,ACTION}
