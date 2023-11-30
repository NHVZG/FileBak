import * as child_process from "child_process";
import path from "path";

//. 构建路径
function resolvePublic(relative){
    return path.resolve(__static,relative);
}

//. 组合方法
function combine(...func){
    let _this=this;
    return (...arg)=>{
        func.filter(f=>f).map(f=>f.bind(_this)(...arg));
    };
}
//. 时间
function time(){
    let date=new Date();
    return date.toLocaleDateString().replaceAll('/','-')+' '+ date.toTimeString().split(' ')[0];
}

//. promise化命令执行
function execAsync(command) {
    /*child_process.exec('wmic logicaldisk get caption', function(err, stdout, stderr) {
       if(err || stderr) {
           console.log("root path open failed" + err + stderr);
           return;
       }
       callback(stdout.replace('Caption','').replace(/\s+/gm,'').split(':').filter(d=>d));
   });*/
    return new Promise(function(resolve, reject) {
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

//. 获取类的注册元数据
function metadata(key,target,group,defaults){
    let obj=Reflect.getMetadata(key, target);
    if(!obj){
        Reflect.defineMetadata(key,obj= {},target);
    }
    if(!obj[group]){
        obj[group]=defaults;
    }
    return obj[group];
}

export {
    execAsync,
    combine,
    time,
    metadata,
    resolvePublic
}