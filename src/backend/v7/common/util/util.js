

//. 文件名
function baseName(filePath){
    return filePath.substring(filePath.lastIndexOf('/')+1);
}

//.根路径名
function rootName(filePath){
    return filePath.indexOf('/')>=0?filePath.substring(0,filePath.indexOf('/')):filePath;
}

//. 相对根目录的文件路径
function relativePath(filePath,root){
    return root?
        filePath.replace(`${formatPath(root)}/`,''):
        filePath.substring(filePath.indexOf('/')+1);
}


//. 格式化路径
function formatPath(...filePaths){
    return filePaths.join('/').replaceAll(/\/+/gm, '/').replaceAll(/\/$/gm,'');
}

export {
    rootName,
    relativePath,
    baseName,
    formatPath
}