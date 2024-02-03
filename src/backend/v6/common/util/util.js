import {Node} from "@/backend/v5/common/entity/Node";

//. 文件名
function baseName(filePath){
    return filePath.substring(filePath.lastIndexOf('/')+1);
}

//. 格式化路径
function formatPath(...filePaths){
    return filePaths.join('/').replaceAll(/\/+/gm, '/').replaceAll(/\/$/gm,'');
}

export {
    baseName,
    formatPath
}