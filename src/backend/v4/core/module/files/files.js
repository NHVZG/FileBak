import fs from "fs";
import * as os from 'os';
import * as child_process from "child_process";
import {execAsync} from "../../../util/util";

const DRIVER=0;                 //, 驱动器
const DIRECTORY=1;          //, 文件夹
const FILE=2;                      //, 文件
const SYMBOL=3;               //, 软连接

//输出win驱动器
async function listWinDriver(){
    /*child_process.exec('wmic logicaldisk get caption', function(err, stdout, stderr) {
        if(err || stderr) {
            console.log("root path open failed" + err + stderr);
            return;
        }
        callback(stdout.replace('Caption','').replace(/\s+/gm,'').split(':').filter(d=>d));
    });*/
    let result=await execAsync('wmic logicaldisk get caption');
    return result.replace('Caption','').replace(/\s+/gm,'').split(':').filter(d=>d)
}

async function listDriver(){
    if(os.platform() === 'win32'){
        return await listWinDriver();
    }
}


async function dir(base) {
    if(!base){
        let drivers=await listDriver();
        return drivers.map(d=>({
            type:DRIVER,
            path:d+":/",
            name:d
        }));
    }
    let typeMap={};
    return fs.readdirSync(base).map(f=>{
        let filepath=base+'/'+f;
        let info;
        try {
            info = fs.lstatSync(filepath);
        }catch (err){
            return null;
        }
        let type=FILE;                          //文件类型
        if(info.isSymbolicLink()){
            type=SYMBOL;
        }else if(info.isDirectory()){
            type=DIRECTORY;
        }
        let index=typeMap[type]||1;
        let idx=type+'-'+index;
        typeMap[type]=++index;
        return {
            path:filepath,
            name:f,
            type,
            idx
        }
    })
        .filter(f=>f)
        .sort((a,b)=>{
            let arr_a=a.idx.split('-');
            let arr_b=b.idx.split('-');
            let type_a=parseInt(arr_a[0]);
            let type_b=parseInt(arr_b[0]);
            if(type_a!==type_b)return type_a-type_b;
            return parseInt(arr_a[1])-parseInt(arr_b[1]);
        });
}

export {dir,listDriver};