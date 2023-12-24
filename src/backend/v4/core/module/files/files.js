import fs from "fs";
import * as os from 'os';
import {execAsync} from "../../../util/util";
import {app} from "electron";
import crypto from "crypto";
import path from "path";
import {FILE_TYPE} from "@/backend/v4/core/constant/constant";
import JSZip from "jszip";
import * as  fse from 'fs-extra'

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


//. 读取zip(支持嵌套zip）
async function zips(relative,absolut,data){
    //relative=formatPath(relative);
    return new Promise( (resolve,reject)=>{
        if(!data){
            let rootZipPath=relative;
            while(!fs.existsSync(rootZipPath)){
                if(!rootZipPath||rootZipPath==='.')return reject();
                rootZipPath=path.dirname(rootZipPath);          //,循环取父目录 直到取到最外层zip
            }
            if(!rootZipPath.endsWith('.zip'))return reject();  //,非zip文件
            fs.readFile(rootZipPath,async (err,data)=>{
                if(err){
                    console.dir(err);
                    return reject(err);
                }
                let relativePath=formatPath(relative.replace(rootZipPath,''));
                let absolutePath=rootZipPath===''||rootZipPath==='.'?(absolut||relative):rootZipPath;
                /*if(!relativePath) {       //,根zip即目的
                    return resolve(()=>data, absolutePath, relativePath);
                }*/
                return resolve(await zips(relativePath,absolutePath,data));
            });
            return;
        }
        new JSZip().loadAsync(data).then(async zip=>{
            if(!relative||relative==='.'){          //, 根目录
                return resolve({data:()=>data, absolut, zip,entry:zip,relative});
            }
            let fileEntry;      //,JSZipObject
            let filePath=relative;
            //let isNestedZip=relativePath.includes(".zip");
            while (!(fileEntry=zip.file(filePath))&&(filePath!=='.')){
                filePath=path.dirname(filePath);                                //,循环取父目录 直到取到最外层zip
            }
            if(!fileEntry){                                                                                             //, 目录
                zip.folder(relative);
                let empty=zip.file(new RegExp(`^${relative}/`)).length===0;
                if(empty){
                    return resolve({data:()=>null,absolut,entry:null,zip,relative});
                }
                resolve({
                    data:async ()=>await new Promise((re,rj)=>{
                        zip.folder(relative).generateAsync({type:"nodebuffer"}).then(content=>re(content));
                    }),
                    absolut:`${absolut}/${relative}`,entry:zip.folder(relative),zip,relative
                });
            }else if(fileEntry&&fileEntry.name.endsWith('.zip')&&fileEntry._data.compressedContent){//,嵌套zip
                let relativePath=formatPath(relative.replace(filePath,''));
                let absolutPath=!filePath||filePath==='.'?(absolut||relative):formatPath(`${absolut}/${filePath}`);
                return resolve(await zips(relativePath,absolutPath,await fileEntry.async("nodebuffer")));
            }else if(fileEntry){    //,文件
                resolve({
                    data:async ()=>await new Promise((re,rj)=>{
                        fileEntry.async("nodebuffer").then(content=>re(content));
                    }),
                    absolut:`${absolut}/${relative}`,entry:fileEntry,zip,relative
                });
            }
        },err=>reject(err));
    });
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
        list= await zipDir(base);
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




//. 读取zip目录
function zipDir(base) {
        return zips(base).then(({data, absolut, zip, entry, relative}) => {
        let set = new Set();
        let fileList = [];
        let typeMap = {};
        //let folderPath = relative === '.' || relative === '' ? '' : relative;
        if(!entry||(!entry.forEach))return fileList;
        entry.forEach((filePath, file) => {
            let directory = filePath.substring(0, filePath.indexOf('/'));
            let fileName = directory ? directory : filePath;
            if (set.has(fileName)) return;
            set.add(fileName);
            let type;
            if (directory) {
                type = FILE_TYPE.DIRECTORY;
            } else if (fileName.endsWith('.zip') && file._data.compressedContent) {
                type = FILE_TYPE.ZIP;
            } else {
                type = FILE_TYPE.FILE;
            }
            let index = typeMap[type] || 1;
            let idx = type + '-' + index;
            typeMap[type] = ++index;
            fileList.push({
                path: formatPath(`${absolut}/${fileName}`),
                name: fileName,
                type,
                idx,
                inZip: true
            });
        });
        return fileList;
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
function hashBuffer(buffer,callback){
    callback(crypto
        .createHash("sha256")
        .update(new Uint8Array(buffer))
        // .update(Buffer.from(fileBuffer))
        .digest("hex"));
}


const chunkSize=1024*1024*100;      //100m
//. 文件
function chunkFile(sourcePath,targetPath,resolve){
    //let cacheDir=app.getAppPath();                 //, 应用目录
    /*let TempDir=app.getPath('temp');   //, 系统缓存目录
    let cacheDir=`${TempDir}/fileBak`;
    if (!fs.existsSync(cacheDir)){
        fs.mkdirSync(cacheDir);
    }*/
    const readStream = fs.createReadStream(sourcePath,{highWaterMark:chunkSize});
    let idx=1;
    let length=0;
    let id=crypto.randomUUID();
    let oneChunk=false;
    readStream.on('data', chunk => {        //, 默认64k大小文件分片
        let buffer=Buffer.from(chunk);
        length=length+chunk.length;
        oneChunk=idx===0&&chunk.length>chunkSize;    //, 是否单个数据块（单个不需等合并直接写入目的文件）
        resolve({
            id,
            end:oneChunk,
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
            if(!oneChunk) {
                resolve({
                    id,
                    end: true,
                    idx: idx++,
                    path: targetPath,
                    name: path.basename(targetPath),
                    length,
                    hash
                });
            }

        });
    });
}

function chunkBuffer(buffer,targetPath,resolve){
    let buf;
    let offset=0;
    let length=0;
    let oneChunk=false;
    let id=crypto.randomUUID();
    let idx=1;
    while((buf=buffer.slice(offset,chunkSize)).length>0){
        length=length+buf.length;
        oneChunk=idx===0&&buf.length>chunkSize;    //, 是否单个数据块（单个不需等合并直接写入目的文件）
        resolve({
            id,
            end:oneChunk,
            idx:idx++,
            path:targetPath,
            name:path.basename(targetPath),
            chunkStr:buffer.toString('binary'),                //,binary=latin1=ISO-8859-1
            hash:crypto.createHash("sha256")
                .update(buffer)
                .digest("hex")
        });
    }
    if(!oneChunk){
        hashBuffer(buffer,(hash)=>{
                resolve({
                    id,
                    end: true,
                    idx: idx++,
                    path: targetPath,
                    name: path.basename(targetPath),
                    length,
                    hash
                });
        });
    }
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

function bufferPath(id){
    let TempDir=app.getPath('temp');   //, 系统缓存目录
    let bufferPath=`${TempDir}/fileBak/${id}`;
    fse.ensureDirSync(bufferPath);
    return bufferPath;
}

function clearBufferPath(){
    let TempDir=app.getPath('temp');   //, 系统缓存目录
    let cacheDir=`${TempDir}/fileBak/`;
    fse.removeSync(cacheDir);
}


//. dir -> zip/xxx/xxx
//. zip/yyy -> zip/xxx/xxx
//. zip/yyy  ->dir

export {dir,listDriver,chunkFile,fileInfo,formatPath,writeBuffer,mergeFile,checkHash,bufferPath,clearBufferPath};