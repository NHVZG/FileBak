import {NodeGenerator} from "@/backend/v6/common/service/fileDiff/generator/NodeGenerator";

class NodeProcessor{
    generator=new NodeGenerator();

    constructor(generator) {
        this.generator=generator;
    }

    children(base){
        return this.generator.children(base);
    }
}