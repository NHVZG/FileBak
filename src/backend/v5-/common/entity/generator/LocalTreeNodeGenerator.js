import {TreeNodeGenerator} from "@/backend/v5/common/entity/generator/TreeNodeGenerator";

class LocalTreeNodeGenerator extends TreeNodeGenerator{

    children(pb){
        return super.children(pb);
    }
}

export {LocalTreeNodeGenerator};