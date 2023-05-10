import path from "path";
import * as child_process from "child_process";

function __time(){
    let date=new Date();
    return date.toLocaleDateString().replaceAll('/','-')+' '+ date.toTimeString().split(' ')[0];
}



//` 构建路径
function __resolvePublic(relative){
    return path.resolve(__static,relative);
}

//` promise化命令执行
function __execAsync(command) {
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

export {
    __time,
    __resolvePublic,
    __execAsync
}