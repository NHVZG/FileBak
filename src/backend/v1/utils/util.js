//获取相对public文件夹下的路径
import path from "path";
import fs from "fs";

function __resolvePublicPath(relative){
    return path.resolve(__static,relative);
}

function __isObject(obj){
    return obj!==null&&typeof obj ==='object'&&(!(obj instanceof Array));
}

function __readFile(filePath){
    return __fileExist(filePath)?fs.readFileSync(filePath):null;
}

function __fileExist(filePath){
    return fs.existsSync(filePath);
}

function __log(text,error=false){
    let content=`[${new Date().toLocaleTimeString()}]${text}`;
    if(error)console.trace(content);
    else console.log(content);
}

function __result(success){
    return success?
        (data,msg)=>({code:1,msg:msg||'success',data:data,success}):
        (msg,code,data)=>({code:code===undefined?-1:code,msg:msg||'fail',data,success})
}


export {
    __result,
    __log,
    __fileExist,
    __isObject,
    __readFile,
    __resolvePublicPath
}