import fs from "fs";
import * as os from 'os';
import {execAsync} from "../../../util/util";
import {app} from "electron";
import crypto from "crypto";
import path from "path";
import {FILE_TYPE} from "@/backend/v4/core/constant/constant";
import JSZip from "jszip";

function formatPath(...path){
    return path.join('/').replaceAll(/\/+/gm, '/').replaceAll(/\/$/gm,'').replace(/^\//,'');
}

//.输出win驱动器
async function listWinDriver(){
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
            type:FILE_TYPE.DRIVER,
            path:d+":/",
            name:d
        }));
    }
    let list=[];
    if((!fs.existsSync(base)&&base.includes(".zip"))||base.endsWith('.zip')){
        list= await zipList(base);
    }else{
        let typeMap={};
        list=fs.readdirSync(base).map(f=>{
            let filepath=base+(base.endsWith('/')?'':'/')+f;
            let info;
            try {
                info = fs.lstatSync(filepath);
            }catch (err){
                return null;
            }
            let type=FILE_TYPE.FILE;                          //文件类型
            if(info.isSymbolicLink()){
                type=FILE_TYPE.SYMBOL;
            }else if(info.isDirectory()){
                type=FILE_TYPE.DIRECTORY;
            }else if(f.endsWith('.zip')){
                type=FILE_TYPE.ZIP;
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
    }
    return list.filter(f=>f)
        .sort((a,b)=>{
            let arr_a=a.idx.split('-');
            let arr_b=b.idx.split('-');
            let type_a=parseInt(arr_a[0]);
            let type_b=parseInt(arr_b[0]);
            if(type_a!==type_b)return type_a-type_b;
            return parseInt(arr_a[1])-parseInt(arr_b[1]);
        });
}

//. 读取zip(支持嵌套zip）
async function zipList(relativePath,absolutePath,data){
    return new Promise( (resolve,reject)=>{
        if(!data){                                                                                                  //,初始化zip文件数据
            let zipPath=relativePath;
            while (!fs.existsSync(zipPath)){
                if(zipPath==='.')return resolve([]);
                zipPath=path.dirname(zipPath);
            }
            let subRelativePath=formatPath(relativePath.replace(zipPath,''));
            fs.readFile(zipPath,async (err, data)=>{
                let subAbsolutePath=zipPath===''||zipPath==='.'?(absolutePath||relativePath):zipPath;
                resolve(await zipList(subRelativePath, subAbsolutePath,data));
            });
            return;
        }

        new JSZip().loadAsync(data).then(async zip=>{
            let fileEntry;
            let zipPath=relativePath;
            if(relativePath==='.'||relativePath===''){      //, 根目录

            }else{
                //let isNestedZip=relativePath.includes(".zip");
                while (!(fileEntry=zip.file(zipPath))&&(zipPath!=='.')){
                    zipPath=path.dirname(zipPath);
                }
            }

            if(!fileEntry){//, 根目录或者尝试用folder
                let set=new Set();
                let fileList=[];
                let typeMap={};
                fileEntry=relativePath==='.'||relativePath===''?zip:zip.folder(relativePath);
                let folderPath=relativePath==='.'||relativePath===''?'':relativePath;
                fileEntry.forEach((filePath,file)=>{
                    let directory=filePath.substring(0,filePath.indexOf('/'));
                    let fileName=directory?directory:filePath;
                    if(set.has(fileName))return;
                    set.add(fileName);
                    let type;
                    if(directory){
                        type=FILE_TYPE.DIRECTORY;
                    }else if(fileName.endsWith('.zip')&&file._data.compressedContent){
                        type=FILE_TYPE.ZIP;
                    }else{
                        type=FILE_TYPE.FILE;
                    }
                    let index=typeMap[type]||1;
                    let idx=type+'-'+index;
                    typeMap[type]=++index;
                    fileList.push({
                        path:formatPath(`${absolutePath}/${folderPath}/${fileName}`),
                        name:fileName,
                        type,
                        idx,
                        inZip:true
                    });
                });
                resolve(fileList);
            }else if(fileEntry&&fileEntry.name.endsWith('.zip')&&fileEntry._data.compressedContent){ //, 嵌套zip
                let subRelativePath=formatPath(relativePath.replace(zipPath,''));
                let subAbsolutePath=zipPath===''||zipPath==='.'?(absolutePath||relativePath):formatPath(`${absolutePath}/${zipPath}`);
                resolve(await zipList(subRelativePath,subAbsolutePath,fileEntry._data.compressedContent));
            }else{
                resolve([]);
            }

        });

    });
}

function fileInfo(filePath){
    let info;
    try {
        info = fs.lstatSync(filePath);
    }catch (err){
        return null;
    }
    let type=FILE_TYPE.FILE;                          //文件类型
    if(info.isSymbolicLink()){
        type=FILE_TYPE.SYMBOL;
    }else if(info.isDirectory()){
        type=FILE_TYPE.DIRECTORY;
    }
    return {
        path:filePath,
        name:path.basename(filePath),
        type,
    }
}


function hashFile(filePath,callback){
    var fd = fs.createReadStream(filePath);
    var hash = crypto.createHash('sha256');
    hash.setEncoding('hex');
    fd.on('end', ()=> {
        hash.end();
        callback(hash.read());
    });
    fd.pipe(hash);
}


//. 文件
function chunkFile(sourcePath,targetPath,resolve){
    //let cacheDir=app.getAppPath();                 //, 应用目录
    let TempDir=app.getPath('temp');   //, 系统缓存目录
    let cacheDir=`${TempDir}/fileBak`;
    if (!fs.existsSync(cacheDir)){
        fs.mkdirSync(cacheDir);
    }
    const readStream = fs.createReadStream(sourcePath,{highWaterMark:1024*1024*100});   //100m
    let idx=1;
    let length=0;
    let id=crypto.randomUUID();
    readStream.on('data', chunk => {        //, 默认64k大小文件分片
        let buffer=Buffer.from(chunk);
        length=length+chunk.length;
        resolve({
            id,
            end:false,
            idx:idx++,
            path:targetPath,
            name:path.basename(targetPath),
            chunkStr:buffer.toString('binary'),                //,binary=latin1=ISO-8859-1
            hash:crypto.createHash("sha256")
                              .update(buffer)
                              .digest("hex")
        });
    });
    readStream.on('end', () => {
        hashFile(sourcePath,(hash)=>{
            resolve({
                id,
                end:true,
                idx:idx++,
                path:targetPath,
                name:path.basename(targetPath),
                length,
                hash});
        });
    });
}

//. 校验hash
function checkHash(chunkStr,hash){
    let buffer=Buffer.from(chunkStr, 'binary');
    return crypto.createHash("sha256")
        .update(buffer)
        .digest("hex")===hash;
}

//. 写文件
function writeBuffer(chunkStr,fileName){
    let directory=path.dirname(fileName);
    if (!fs.existsSync(directory)){
        fs.mkdirSync(directory, { recursive: true });
    }
    let stream = fs.createWriteStream(fileName);
    stream.once('open', function(fd) {
        stream.write(Buffer.from(chunkStr,'binary'));
        stream.end();
    });
}

function merge(file,w,resolve){
    return ()=> {
        let r = fs.createReadStream(file);
        r.pipe(w, {end: false});
        r.on('end', resolve);
        r.on('error', () => w.close())
    };
}

//. 合并文件
function mergeFile(targetFilePath,files){
    return new Promise((resolve,reject)=>{
        //, 内存读写流
        /*for(let file of files){
            fs.appendFileSync(targetFilePath, fs.readFileSync(file));
        }*/
        //, 使用pipe 减小内存使用
        let  w = fs.createWriteStream(targetFilePath, {flags: 'a'});
        let nextStep=()=>{                                           //,最后一步
            w.close();
            resolve();
        }
        for(let i=files.length-1;i>-1;i--){
            nextStep=merge(files[i],w,nextStep);                         //, 从后往前组装调用链，因必须在readstream结束后(end事件)才可调用下一个流，否则文件会写入错序覆盖
        }
        nextStep();
        //w.on('close', ()=>console.log("done writing"));
    });
}



export {dir,listDriver,chunkFile,fileInfo,formatPath};