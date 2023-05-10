import path from "path";


function __time(){
    let date=new Date();
    return date.toLocaleDateString().replaceAll('/','-')+' '+ date.toTimeString().split(' ')[0];
}



//` 构建路径
function __resolvePublic(relative){
    return path.resolve(__static,relative);
}

export {
    __time,
    __resolvePublic
}