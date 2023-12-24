import {FILE_TYPE} from "@/backend/v4/core/constant/constant";

function buildFileNode(struct){
    return struct.map(file=>({
        type:file.type,
        name:file.name,
        label:file.name,
        path:file.path,
        display:true,
        leaf:FILE_TYPE.SYMBOL===file.type||FILE_TYPE.FILE===file.type
    }))
    .sort((a,b)=>
        a.type===b.type?
            a.name.localeCompare(b.name):a.type-b.type
    );
}

function clone(obj){
    return JSON.parse(JSON.stringify(obj));
}

function format(...path){
    return path.join('/').replaceAll(/\/+/gm, '/').replaceAll(/\/$/gm,'').replace(/^\//,'');
}


export {
    clone,
    format,
    buildFileNode
}