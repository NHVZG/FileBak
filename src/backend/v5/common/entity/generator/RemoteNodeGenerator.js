import {TreeNodeGenerator} from "@/backend/v5/common/entity/generator/TreeNodeGenerator";

class RemoteNodeGenerator extends TreeNodeGenerator{
    children(pb){
        return super.children(pb);
    }
}

export {RemoteNodeGenerator};