import {NodeGenerator} from "@/backend/v5/common/service/generator/NodeGenerator";

class NodeProcessor{
    generator=new NodeGenerator();

    constructor(generator=new NodeGenerator()) {
        this.generator=generator;

    }

    children(pb){
        return this.generator.children(pb);
    }

    buildRelate(){

    }

}

export {NodeProcessor}