import fs from "fs";

function dir(base) {
    let directory=0;        //文件夹索引
    let file=0;                 //文件索引

    let struct=fs.readdirSync(base).map(f=>{
        let filepath=base+'/'+f;
        let isDirectory=fs.lstatSync(filepath).isDirectory();
        let idx='';
        if(isDirectory){
            idx='1-'+(++directory);
        }else{
            idx='2-'+(++file);
        }
        return {
            isDirectory,
            path:filepath,
            name:f,
            idx
        }
    }).sort((a,b)=>{
        let arr_a=a.idx.split('-');
        let arr_b=b.idx.split('-');
        let type_a=parseInt(arr_a[0]);
        let type_b=parseInt(arr_b[0]);
        if(type_a!==type_b)return type_a-type_b;
        return parseInt(arr_a[1])-parseInt(arr_b[1]);
    });
    return struct;
}

export {dir};