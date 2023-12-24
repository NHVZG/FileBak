import {FILE_TYPE} from "@/backend/v4/core/constant/constant";
import * as os from 'os';
import * as  fse from 'fs-extra'
import path from "path";
import JSZip from "jszip";
import fs from "fs";
import {execAsync} from "@/backend/v4/util/util.js";
import crypto from "crypto";
import {app} from "electron";

//const CHUNK_SIZE=1024*1024*100;      //, 切片大小100m
const CHUNK_SIZE=1024*15;      //, 切片不能超过16k 否则会断流

//.输出win驱动器
async function listWinDriver(){
    if(os.platform() === 'win32') {
        let result = await execAsync('wmic logicaldisk get caption');
        return result.replace('Caption', '').replace(/\s+/gm, '').split(':').filter(d => d)
    }
}


//. 是否zip
async function isZip(data){
    try{
        await new JSZip().loadAsync(data);
        return true;
    }catch (err){
        //,非可读zip文件 跳过，认为冲突
        return false;
    }
}

//. 目录列表
async function dir(base) {
    if(!base){
        let drivers=await listWinDriver();
        return drivers.map((d,idx)=>new FileItem(d+":/",d,FILE_TYPE.DRIVER,idx,true));
    }
    let list=[];
    if((!fs.existsSync(base)&&base.includes(".zip"))){
        let {fileList}= await zipDir(base);
        list=fileList;
    }else if(!fs.lstatSync(base).isDirectory()&&base.endsWith(".zip")){
        let {fileList}= await zipDir(base);
        list=fileList;
    }else{
        let typeMap={};
        let names=fs.readdirSync(base);
        const promises=[];
        for(let f of names){
            promises.push(new Promise(async (resolve,reject)=>{
                let filepath=base+(base.endsWith('/')?'':'/')+f;
                let info;
                try {
                    info = fs.lstatSync(filepath);
                }catch (err){
                    reject(err);
                }
                let type=FILE_TYPE.FILE;                          //文件类型
                if(info.isSymbolicLink()){
                    type=FILE_TYPE.SYMBOL;
                }else if(info.isDirectory()){
                    type=FILE_TYPE.DIRECTORY;
                }else if(f.endsWith('.zip')&&await isZip(fs.readFileSync(filepath))){
                    type=FILE_TYPE.ZIP;
                }
                let index=typeMap[type]||1;
                let idx=type+'-'+index;
                typeMap[type]=++index;
                list.push(new FileItem(filepath,f,type,idx,true));
                resolve();
            }));
        }
        await Promise.all(promises);
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


//. zip目录
/*function zipDir(base,rootZipEntry) {
    base=formatPath(base);
    return zips(base,null,null,rootZipEntry,rootZipEntry)
        .then(({data, absolut, zip, entry, relative,zipEntry,pZipEntry,rootZipEntry}) => {
            let set = new Set();
            let fileList = [];
            let typeMap = {};
            //let folderPath = relative === '.' || relative === '' ? '' : relative;
            if (!entry || (!entry.forEach)) return {fileList,rootZipEntry};
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
                fileList.push(new FileItem(formatPath(`${absolut}/${fileName}`), fileName,type,idx,true,zipEntry,pZipEntry,rootZipEntry));
            });
            return {fileList,rootZipEntry};
        });
}*/
function zipDir(base,rootZipEntry) {
    base=formatPath(base);
    return zips(base,null,null,rootZipEntry,rootZipEntry)
        .then(async ({data, absolut, zip, entry, relative,zipEntry,pZipEntry,rootZipEntry}) => {
            let set = new Set();
            let fileList = [];
            let typeMap = {};
            //let folderPath = relative === '.' || relative === '' ? '' : relative;
            if (!entry || (!entry.forEach)) return {fileList,rootZipEntry};
            const promises=[];
            entry.forEach((filePath, file) => {
                promises.push(new Promise(async (resolve,reject)=>{
                    let directory = filePath.substring(0, filePath.indexOf('/'));
                    let fileName = directory ? directory : filePath;
                    if (set.has(fileName)){
                        resolve();
                        return;
                    }
                    set.add(fileName);
                    let type;
                    if (directory) {
                        type = FILE_TYPE.DIRECTORY;
                    } else if (fileName.endsWith('.zip') && await isZip(file.async("nodebuffer"))) {
                        type = FILE_TYPE.ZIP;
                    } else {
                        type = FILE_TYPE.FILE;
                    }
                    let index = typeMap[type] || 1;
                    let idx = type + '-' + index;
                    typeMap[type] = ++index;
                    fileList.push(new FileItem(formatPath(`${absolut}/${fileName}`), fileName,type,idx,true,true,zipEntry,pZipEntry,rootZipEntry));
                    resolve();
                }));
            });
            await Promise.all(promises);
            return {fileList,rootZipEntry};
        });
}


//. 文件信息
async function lstat(filepath,zipWhenNotFound=false,rootZipEntry){
    return new Promise(async (resolve,reject)=>{
        if((!fs.existsSync(filepath)&&filepath.includes(".zip"))){
            let parent=formatPath(filepath);
            while((parent=path.dirname(parent))!=='.'){
                if(fs.existsSync(parent))break;
                if(parent==='/')break;
            }
            if(parent==='.'||parent==='/'||parent.endsWith(":")||!fs.existsSync(parent)){
                resolve(null);
                return;
            }
            try {
                let info = fs.lstatSync(parent);                                               //, 确定.zip后缀的是文件而非文件夹
                if(info.isDirectory()){
                    resolve(null);
                    return;
                }
                if(await isZip(fs.readFileSync(parent))){
                    return zips(filepath, null, null, rootZipEntry, rootZipEntry)
                        .then(({data, absolut, zip, entry, relative, zipEntry, pZipEntry, rootZipEntry, type}) => {
                            resolve(entry ? new FileItem(absolut, path.dirname(absolut), type, 0, true, true, zipEntry, pZipEntry, rootZipEntry, data) :
                                (zipWhenNotFound ? new FileItem(absolut, path.dirname(absolut), type, 0, false, true, zipEntry, pZipEntry, rootZipEntry, null) : null));
                        }, () => resolve(null));
                }else{
                    resolve(null);
                }
            }catch (err){
                resolve(null);
            }
        }else{
            if(!fs.existsSync(filepath)){
                resolve(null);
                return;
            }
            let info;
            try {
                info = fs.lstatSync(filepath);
            }catch (err){
                resolve(null);
                return;
            }
            let type=FILE_TYPE.FILE;                          //文件类型
            if(info.isSymbolicLink()){
                type=FILE_TYPE.SYMBOL;
            }else if(info.isDirectory()){
                if(filepath.endsWith(":")){
                    type=FILE_TYPE.DRIVER;
                }else {
                    type = FILE_TYPE.DIRECTORY;
                }
            }else if(filepath.endsWith('.zip')&&(await isZip(fs.readFileSync(filepath)))){
                //type=FILE_TYPE.ZIP;
                return zips(filepath,null,null,rootZipEntry,rootZipEntry)
                    .then(({data, absolut, zip, entry, relative,zipEntry,pZipEntry,rootZipEntry,type}) => {
                        resolve(entry?new FileItem(absolut,path.dirname(absolut),type,0,true,true,zipEntry,pZipEntry,rootZipEntry,data):
                            (zipWhenNotFound?new FileItem(absolut,path.dirname(absolut),type,0,false,true,zipEntry,pZipEntry,rootZipEntry,null):null));
                    },()=>resolve(null));
            }
            resolve(new FileItem(filepath,path.basename(filepath)||filepath,type,true));
        }
    });
}



//. 校验hash
function checkHash(chunkStr,hash){
    let buffer=Buffer.from(chunkStr, 'binary');
    return crypto.createHash("sha256")
        .update(buffer)
        .digest("hex")===hash;
}

//. hash文件
function hashFile(filePath){
    return new Promise((resolve,reject)=>{
        let fd = fs.createReadStream(filePath);
        let hash = crypto.createHash('sha256');
        hash.setEncoding('hex');
        fd.on('end', ()=> {
            hash.end();
            resolve(hash.read());
        });
        fd.pipe(hash);
    });
}

//. hash字节
function hashBuffer(buffer){
    return new Promise((resolve,reject)=>{
        resolve(crypto
            .createHash("sha256")
            .update(new Uint8Array(buffer))
            //update(Buffer.from(fileBuffer))
            .digest("hex"));
    });
}



//todo zip内


//. 文件切片
async function chunkFile(sourcePath,targetPath,resolve){
    const {size} = fs.statSync(sourcePath);
    const readStream = fs.createReadStream(sourcePath,{highWaterMark:CHUNK_SIZE});
    let oneChunk=false;
    let builder=new ChunkBuilder(
        crypto.randomUUID(),
        targetPath,
        path.basename(targetPath),
        await hashFile(sourcePath));
    readStream.on('data', chunk => {        //, 默认64k大小文件分片
        let buffer=Buffer.from(chunk);
        oneChunk=builder.idx===0&&chunk.length<CHUNK_SIZE;
        resolve(builder.chunk(buffer,oneChunk,size));//, 是否单个数据块（单个不需等合并直接写入目的文件）
    });
    readStream.on('end', () => {
      if(!oneChunk){
          resolve(builder.chunk(null,true,size));
      }
    });
}

//. 字节切片
async function chunkBuffer(buffer,targetPath,resolve){
    let chunk;
    let oneChunk=false;
    let builder=new ChunkBuilder(
        crypto.randomUUID(),
        targetPath,
        path.basename(targetPath),
        await hashBuffer(buffer));
    while((chunk=buffer.slice(builder.offset,builder.offset+CHUNK_SIZE)).length>0){
        let bufferChunk=Buffer.from(chunk);
        oneChunk=builder.idx===0&&bufferChunk.length<CHUNK_SIZE;
        await resolve(builder.chunk(bufferChunk,oneChunk,buffer.length));
    }
    if(!oneChunk){
        await resolve(builder.chunk(null,true,buffer.length));
    }
}

//. 文件切片字符串写文件
function writeBuffer(chunkStr,fileName){
    return new Promise(async(resolve,reject)=>{
        let directory=path.dirname(fileName);
        if (!fs.existsSync(directory)){
            fs.mkdirSync(directory, { recursive: true });
        }
        let stream = fs.createWriteStream(fileName);
        stream.once('open', function(fd) {
            stream.write(Buffer.from(chunkStr||"",'binary'));
            stream.end();
        });
        stream.on('finish',resolve);
    });
}



//. 合并切片文件
function mergeFile(files,targetFilePath){
    return new Promise(async (resolve,reject)=>{
        //, 内存读写流
        /*for(let file of files){
            fs.appendFileSync(targetFilePath, fs.readFileSync(file));
        }*/
        //, 使用pipe 减小内存使用
        //writeStream.on('close', ()=>console.log("done writing"));
        let  writeStream = fs.createWriteStream(targetFilePath, {flags: 'a'});
        for(let filePath of files){
            await pipeFileStream(filePath,writeStream).then(()=>{},reject);
        }
        writeStream.close();
        resolve();
    });
}


//. 创建缓存路径
function bufferPath(id){
    let bufferPath=`${app.getPath('temp')}/fileBak/${id}`;
    fse.ensureDirSync(bufferPath);
    return bufferPath;
}

//. 清空系统缓存目录
function clearBufferPath(id){
    fse.removeSync(id?`${app.getPath('temp')}/fileBak/${id}`:`${app.getPath('temp')}/fileBak/`);
}

//.删除文件
function deleteFile(path){
    fse.removeSync(path);
}

//. 创建zip(fileList=[{source:源文件,relative:zip中相对路径}])
function newZip(fileList){
    return new Promise(async (resolve,reject)=>{
        let zip = new JSZip();
        let idx=0;
        for(let file of fileList){
            let f=await lstat(file.source);
            if(!f)continue;
            if(f.zipData){                                  //, zip文件
                idx++;
                zip.file(f.relative,f.zipData());
                if(idx===fileList.length)resolve();
            }else{
                fs.readFile(file.source,async function(err,bf){
                    idx++;
                    if(err){
                        reject(err);
                        return;
                    }
                    zip.file(f.relative,bf);
                    if(idx===fileList.length)resolve();
                });
            }
        }
    });
}


//. 合并zip(自动判断zip和文件夹进行合并)
//, source源文件 target合并目标
async function mergeZips(source,target,sourceZipData,targetZipData){
    if(!sourceZipData){
        sourceZipData = fs.readFileSync(source);
    }
    if(!targetZipData){
        targetZipData = fs.readFileSync(target);
    }
    let sourceZip=await new JSZip().loadAsync(sourceZipData);
    let targetZip=await new JSZip().loadAsync(targetZipData);
    for(let [sourceName, sourceObj] of Object.entries(sourceZip.files)) {

        let relative=sourceName;
        let targetObj;
        while((targetObj=targetZip.file(relative))==null&&relative!=='.'){
            relative=path.dirname(relative);
            relative=relative==='/'?'.':relative;
        }

        if(targetObj&&relative===sourceName){                                          //, 已存在文件

            let subSourceZipData=await sourceObj.async("nodebuffer");
            let subTargetZipData=await targetObj.async("nodebuffer");
            //if(targetObj._data.compressedContent&&sourceObj._data.compressedContent&&relative.endsWith('.zip')){//, 递归下一层zip
            if(await isZip(subSourceZipData)&&await isZip(subTargetZipData)&&relative.endsWith('.zip')){//, 递归下一层zip
                let subSource=formatPath(source,relative);
                let subTarget=formatPath(target,relative);
                let tZip=await mergeZips(subSource,subTarget,subSourceZipData,subTargetZipData);
                targetZip.file(relative,tZip.generateAsync({type:"nodebuffer"}));
            }else {
                targetZip.file(sourceName, await sourceObj.async("nodebuffer"))
            }
        }else if(targetObj&&relative!=='.'&&(await isZip(await targetObj.async('nodebuffer')))&&relative.endsWith('.zip')){ //, zip文件
            let subSingleSourceZip = new JSZip();
            subSingleSourceZip.file(formatPath(sourceName.replace(relative,'')),await sourceObj.async("nodebuffer"));
            let subSourceZipData=await subSingleSourceZip.generateAsync({type:"nodebuffer"});
            let subTargetZipData=await targetObj.async("nodebuffer");
            let tZip=await mergeZips(formatPath(source,relative),formatPath(target,relative),subSourceZipData,subTargetZipData);
            targetZip.file(relative,tZip.generateAsync({type:"nodebuffer"}));
        }else if(targetObj&&relative!=='.'&&targetObj.dir){                                    //, 空文件夹
            targetZip.file(sourceName,await sourceObj.async("nodebuffer"));
        }else if(targetObj&&relative!=='.'){                                                      //, 路径冲突 已有文件则忽略 source为文件夹 target为文件

        }else if(!targetObj){                                                                      //,不存在文件
            let formatSource=formatPath(sourceName)+'/';
            let targetFolder=Object.keys(targetZip.files).some(name=>formatPath(name).startsWith(formatSource));//, 如果获取不到文件,判断是否为文件夹且包含文件
            //if(targetFolder&&sourceObj._data.compressedContent&&sourceName.endsWith('.zip')){//, 目标为文件夹，源文件为zip
            if(targetFolder&&(await isZip(await sourceObj.async("nodebuffer")))&&sourceName.endsWith('.zip')){//, 目标为文件夹，源文件为zip
                let subTargetZip = new JSZip();
                const promises = [];
                targetZip.folder(sourceName).forEach((name,file)=>{
                    if(!targetZip.file(file.name))return;
                    promises.push(new Promise(async (resolve,reject)=>{
                        subTargetZip.file(name,await targetZip.file(file.name).async("nodebuffer"));
                        resolve();
                    }));
                });
                await Promise.all(promises);
                let subSourceZipData=await sourceObj.async("nodebuffer");
                let subTargetZipData=await subTargetZip.generateAsync({type:"nodebuffer"});
                let tZip=await mergeZips(formatPath(source,relative),formatPath(target,relative),subSourceZipData,subTargetZipData);

                const unzipPromises = [];
                tZip.forEach((fileName,file)=>{
                    if(!tZip.file(file.name))return;
                    unzipPromises.push(new Promise(async (resolve,reject)=>{
                        targetZip.file(formatPath(sourceName,file.name),await tZip.file(file.name).async("nodebuffer"));
                        resolve();
                    }));
                });
                await Promise.all(unzipPromises);

            }else if(sourceObj.dir){//,文件夹的忽略
                //targetZip.folder(sourceName);
            }else if(targetFolder){//, zip目标文件夹含有文件的忽略

                targetZip.file(sourceName,await sourceObj.async("nodebuffer"));
            }else{
                targetZip.remove(formatSource); //,防止同名
                targetZip.remove(sourceName);
                targetZip.file(sourceName,await sourceObj.async("nodebuffer"));
            }
        }
    }
    return targetZip;
}

//, zip解压至目录中（zip则合并）
async function mergeZip2Dir(jszip,directory){
    let dir=await lstat(directory);
    if(dir&&dir.rootZipEntry){                                                                              //, 目标目录在zip中
        let relative=directory.replace(dir.rootZipEntry.zipPath,'');
        let zip;
        if(relative) {
            zip=new JSZip();
            zip.file(relative,await jszip.generateAsync({type:"nodebuffer"}));
        }else{
            zip=jszip;
        }
        return await mergeZips(null,null,await zip.generateAsync({type:"nodebuffer"}),await dir.rootZipEntry.buffer());
    }

    let bakFiles=[];
    let newFiles=[];
    const promises=[];
    let zipMap={};
    try {
        jszip.forEach((filename, sourceFile) => {
            if (sourceFile.dir) return;
            promises.push(new Promise(async (resolve, reject) => {
                let absolutPath = formatPath(directory, filename);
                let targetFile = await lstat(absolutPath, true);
                let sourceBuffer = await sourceFile.async("nodebuffer");
                if (targetFile && targetFile.rootZipEntry) {                                         //, 目标文件在zip中
                    let relative = filename.replace(formatPath(targetFile.rootZipEntry.zipPath.replace(formatPath(directory), '')), '');    //,源文件相对目标文件所在根zip的路径 整合所有文件进行zip合并
                    if (!relative && (!await isZip(sourceBuffer))) {                            //,冲突 源文件普通文件且目标文件为zip
                        resolve();
                        return;
                    }
                    if (!zipMap[targetFile.rootZipEntry.zipPath]) {
                        zipMap[targetFile.rootZipEntry.zipPath] = {targetZip: targetFile.rootZipEntry,list: []};
                    }
                    relative = formatPath(relative);
                    zipMap[targetFile.rootZipEntry.zipPath].list.push({targetZip: targetFile.rootZipEntry,filename,targetFile,sourceFile,relative,sourceBuffer});
                } else if (targetFile && targetFile.exist) {                                                                                                                                     //, 目标文件存在
                    if(targetFile.type===FILE_TYPE.DIRECTORY){
                        if(await isZip(sourceBuffer)) await mergeZip2Dir(await new JSZip().loadAsync(sourceBuffer), targetFile.path);                      //, 源文件是zip，目标是文件夹 递归
                        else{}                                                                                                                                                                                 //, 源文件是文件  目标是文件夹 冲突
                    }else if(targetFile.type===FILE_TYPE.ZIP&&await isZip(sourceBuffer)){                                                                                   //, 源文件是zip，目标文件是zip ⭕替换   🔴合并
                        await mergeZips(null, targetFile.path, sourceBuffer);
                    }else {                                                                                                                                                                                    //, 替换文件
                        let bak = `${absolutPath}.bak_${new Date().getTime()}`;
                        fs.renameSync(absolutPath, bak);
                        fs.writeFileSync(absolutPath, sourceBuffer);
                        bakFiles.push({bak, path: absolutPath});
                    }
                } else {                                                                                                                                                                                       //, 不存在文件
                    let parent = absolutPath;
                    while ((parent = path.dirname(parent)) !== '.') {
                        let fileItem;
                        if (!(fileItem = await lstat(parent))) continue;
                        switch (fileItem.type){
                            case FILE_TYPE.ZIP:
                            case FILE_TYPE.DIRECTORY:
                            case FILE_TYPE.DRIVER:           resolve();                                                                                                                         //, 查找路径存在叶节点为路径冲突退出
                                return;
                            default:                                   break;
                        }
                    }
                    newFiles.push(absolutPath);
                    fse.ensureDirSync(path.dirname(absolutPath));
                    fs.writeFileSync(absolutPath, sourceBuffer);
                }
                resolve();
            }));
        });
        await Promise.all(promises);
        for (let entry of Object.entries(zipMap)) {
            let zipPath = entry[0];
            let object = entry[1];
            let zip;
            if(object.list.length===1&&(!object.list[0].relative)&&await isZip(object.list[0].sourceBuffer)){                                                        //,源文件为zip且只有一个则不用构建zip
                zip=await new JSZip().loadAsync(object.list[0].sourceBuffer);
            }else{
                zip= new JSZip();
                for (let item of object.list) {
                    zip.file(item.relative, item.sourceBuffer);
                }
            }
            let mergeZip = await mergeZips(null, null, await zip.generateAsync({type: "nodebuffer"}), await object.targetZip.buffer());
            let bak = `${object.targetZip.zipPath}.bak_${new Date().getTime()}`;
            fs.renameSync(object.targetZip.zipPath, bak);
            bakFiles.push({bak, path: object.targetZip.zipPath});
            mergeZip.generateNodeStream({type: 'nodebuffer', streamFiles: true})
                .pipe(fs.createWriteStream(object.targetZip.zipPath));
        }
    }catch (err){
        //, 异常恢复所有备份,删除写入的（暂不传递给父递归）
        for(let bak of bakFiles){
            deleteFile(bak.path);
            fs.renameSync(bak.bak, bak.path);
        }
        for(let newfile of newFiles){
            deleteFile(newfile);
        }
        throw err;
    }
    //, 成功删除备份文件（暂不传递给父递归）
    for(let bak of bakFiles){
        deleteFile(bak.bak);
    }
}



//. 格式化FileItem
function serializeFileItem(data){
    return JSON.stringify(data,(k,v)=>{
        switch(k){
            case 'zipEntry':return undefined;
            case 'pZipEntry':return undefined;
            case 'rootZipEntry':return undefined;
            default:return v;
        }
    });
}
//let fileList=await zipDir('D:/Home/Downloads/test/a.zip');
//let fileList=await zipDir('D:/Home/Downloads/test/a.zip/a');
//let fileList=await zipDir('D:/Test/base/a.zip/a/b.zip');
//let fileList=await zipDir('D:/Test/base/a.zip/a/b.zip/b');
//let fileList=await zipDir('D:/Test/base/a.zip/a/b.zip/b/d');
//let fileList=await zipDir('D:/Test/base/a.zip/a/b.zip/b/d/1107094.jpg');
//let fileList=await zipDir('D:/Test/base/a.zip/a/b.zip/b/h');
//let fileList=await zipDir('D:/Test/base/a.zip/a/b.zip/b/c');
//let fileList=await zipDir('D:/Test/base/a.zip/a/b.zip/k.zip');
//let fileList=await zipDir('D:/Test/base/a.zip/a/b.zip/k.zip/k');
//let fileList=await zipDir('D:/Test/base/a.zip/a/b.zip/k.zip/k/s.bmp');
//let fileList=await zipDir('D:/Test/base/a.zip/b');
//let fileList=await zipDir('D:/Test/base/a.zip/b/ada.txt');
//let fileList=await zipDir('D:/Test/base/a.zip/b/ada.txt/sd'); 空文件


//let {fileList,rootZipEntry}=await zipDir('D:/Test/base/a.zip/a/b.zip/k.zip/k/s.bmp');
//let x=await zipDir('D:/Test/base/a.zip/a/b.zip/k.zip/k',rootZipEntry);


/*let {fileList,rootZipEntry}=await zipDir('D:/Test/base/a.zip/a/b.zip/k.zip/k/s.bmp');
await zips('D:/Test/base/a.zip/a/b.zip/k.zip',null,null,rootZipEntry,rootZipEntry).then(({data, absolut, zip, entry, relative,zipEntry,pZipEntry,rootZipEntry}) => {
    return new Promise((resolve,reject)=> {
        fs.readFile("D:/Home/Picture/壁纸/1107094.jpg", async function (err, bf) {
            resolve(await zipEntry.file("a123/1107094.jpg", bf));
        });
    });
});
await zips('D:/Test/base/a.zip',null,null,rootZipEntry,rootZipEntry).then(({data, absolut, zip, entry, relative,zipEntry,pZipEntry,rootZipEntry}) => {
    return new Promise((resolve,reject)=> {
        fs.readFile("D:/Home/Picture/fu_e2d62f4d.gif",async function(err,bf){
            await zipEntry.file("gif/fu_e2d62f4d.gif",bf);
            resolve(await zipEntry.save('D:/Home/Downloads/test/a123.zip'));

            console.log(rootZipEntry)
            await zipEntry.zip.file("a/b.zip").async("nodebuffer")
                .then(JSZip.loadAsync)
                .then(b=>b.file("k.zip").async("nodebuffer").then(JSZip.loadAsync).then(k=>{
                    console.log(123);
                }));

        });
    });
});*/

export {
    dir,
    zipDir,
    lstat,

    checkHash,
    hashBuffer,
    hashFile,

    chunkFile,
    chunkBuffer,
    mergeFile,
    writeBuffer,
    newZip,
    deleteFile,
    mergeZips,
    mergeZip2Dir,

    bufferPath,
    clearBufferPath,
    formatPath,
    serializeFileItem,

    ZipEntry
}


//. 格式化路径
function formatPath(...path){
    return path.join('/').replaceAll(/\/+/gm, '/').replaceAll(/\/$/gm,'').replace(/^\//,'');
}


//. 管道读取文件传送至写入流
function pipeFileStream(filePath,writeStream){
    return new Promise((resolve,reject)=>{
        let readStream = fs.createReadStream(filePath);
        readStream.pipe(writeStream, {end: false});
        readStream.on('end', resolve);
        readStream.on('error', () => {
            writeStream.close();
            reject();
        });
    });
}

//, xxx.zip/yyyy/xcas.zip/zzz
//. 读取zip(支持嵌套zip）
async function zips(relative,absolut,data,zipEntry,rootZipEntry,pZipEntry){
    return new Promise( async (resolve,reject)=>{
        if(!data&&!rootZipEntry){                                                                               //, 初始化
            let rootZipPath=relative;
            while(!fs.existsSync(rootZipPath)){
                if(!rootZipPath||rootZipPath==='.'){
                    reject();
                    return
                }
                rootZipPath=path.dirname(rootZipPath);          //,循环取父目录 直到取到最外层zip
            }
            if(!rootZipPath.endsWith('.zip')){//,非zip文件
                reject();
                return;
            }
            let relativePath=formatPath(relative.replace(rootZipPath,''));
            let absolutePath=rootZipPath===''||rootZipPath==='.'?(absolut||relative):rootZipPath;
            if(rootZipEntry&&rootZipEntry.zipPath===rootZipPath){                       //,已存在初始化zip
                resolve(await zips(relativePath,absolutePath,null,rootZipEntry,rootZipEntry,null));
                return;
            }
            fs.readFile(rootZipPath,async (err,data)=>{
                if(err){
                    console.dir(err);
                    reject(err);
                    return;
                }
                /*if(!relativePath) {       //,根zip即目的
                    return resolve(()=>data, absolutePath, relativePath);
                }*/
                resolve(await zips(relativePath,absolutePath,data));
            });
            return;
        }else if(!absolut&&rootZipEntry){//,根节点
            relative=formatPath(relative.replace(rootZipEntry.zipPath,''));
            absolut=rootZipEntry.zipPath;
        }

        (zipEntry&&(!data)?
                new Promise(r=>r(zipEntry.zip)):
                new JSZip().loadAsync(data)
        ).then(async zip=>{
            if(!zipEntry){
                zipEntry=new ZipEntry(zip,absolut,pZipEntry);
                if(pZipEntry)pZipEntry.children[absolut]=zipEntry;
            }
            if(!pZipEntry)pZipEntry=zipEntry;
            if(!rootZipEntry)rootZipEntry=zipEntry;
            if(!relative||relative==='.'){          //, 根目录
                resolve({
                    type:FILE_TYPE.ZIP,
                    data:async ()=>pZipEntry?await pZipEntry.buffer():data,
                    absolut, zip,relative,zipEntry,pZipEntry,rootZipEntry,
                    entry:zip});
                return;
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
                    resolve({data:()=>null,absolut,entry:null,zip,relative,zipEntry,pZipEntry,rootZipEntry});
                    return;
                }
                resolve({
                    type:FILE_TYPE.DIRECTORY,
                    data:async ()=>await new Promise((re,rj)=>{
                        zip.folder(relative).generateAsync({type:"nodebuffer"}).then(content=>re(content));
                    }),
                    absolut:`${absolut}/${relative}`,entry:zip.folder(relative),zip,relative,zipEntry,pZipEntry,rootZipEntry
                });
            }else if(fileEntry&&fileEntry.name.endsWith('.zip')&&isZip(await fileEntry.async("nodebuffer"))/*fileEntry._data.compressedContent*/){//,嵌套zip
                let relativePath=formatPath(relative.replace(filePath,''));
                let absolutPath=!filePath||filePath==='.'?(absolut||relative):formatPath(`${absolut}/${filePath}`);
                let subZipData=zipEntry&&zipEntry.children[absolutPath]?null:await fileEntry.async("nodebuffer");
                return resolve(await zips(relativePath,absolutPath,subZipData,zipEntry?zipEntry.children[absolutPath]:null,rootZipEntry,zipEntry));
            }else if(fileEntry&&relative===filePath){    //,文件
                resolve({
                    data:async ()=>await new Promise((re,rj)=>{
                        fileEntry.async("nodebuffer").then(content=>re(content));
                    }),
                    type:FILE_TYPE.FILE,
                    absolut:`${absolut}/${relative}`,entry:fileEntry,zip,relative,zipEntry,pZipEntry,rootZipEntry
                });
            }else{//, 无此文件
                resolve({data:async ()=>null,absolut:`${absolut}/${relative}`,entry:null,zip,relative,zipEntry,pZipEntry,rootZipEntry});
            }
        },err=>reject(err));
    });
}

class ChunkBuilder{
    id;                  //, 唯一标识
    idx=0;            //, 顺序
    path;             //, 目标路径
    name;            //, 目标文件名
    size=0;           //,文件总大小
    offset=0;        //,已传文件大小
    fileHash;         //,文件hash

    constructor(id, path, name,fileHash) {
        this.id = id;
        this.path = path;
        this.name = name;
        this.fileHash = fileHash;
    }

    chunk(buffer,end=false,size){
        if(buffer){
            this.offset=this.offset+buffer.length;
        }
        this.size=size;
        return {
            id:this.id,
            idx:++this.idx,
            path:this.path,
            name:this.name,
            fileSize:size,
            offset:this.offset,
            fileHash:this.fileHash,
            end:end,                                                                                                                  //, 是否最后一片
            chunkStr:buffer?buffer.toString('binary'):null,                                                           //, 文件切片字符串 binary=latin1=ISO-8859-1
            chunkHash:buffer?crypto.createHash("sha256").update(buffer).digest("hex"):null,     //, 文件切片hash
            chunkSize:buffer?buffer.length:null,                                                                        //, 文件片大小
        };
    }

}


class FileItem{
    path;                //, 路径
    name;              //, 文件名
    type;                //, 文件类型
    idx;                  //, 排序
    exist;               //, 是否存在（zip时目标文件不存在为了返回zip数据时，需要返回FileItem）加多此标识
    inZip=false;     //, zip里的文件
    zipEntry;          //, 当前所属zip
    pZipEntry;        //, 上一级zip
    rootZipEntry;   //, 根zip
    zipData;          //, zip数据

    constructor(path, name, type, idx,exist=true,inZip=false,zipEntry,pZipEntry,rootZipEntry,zipData) {
        this.path = path;
        this.name = name;
        this.type = type;
        this.idx = idx;
        this.exist = exist;
        this.inZip = inZip;
        this.zipEntry = zipEntry;
        this.pZipEntry = pZipEntry;
        this.rootZipEntry = rootZipEntry;
        this.zipData = zipData;
    }
}

class ZipEntry{
    zip;                                        //, jszip对象
    zipPath;                                 //, zip的路径
    parentZip;                              //, 父jszip对象
    children={};                     //, 子jszip
    constructor(zip, zipPath, parentZip, children={}) {
        this.zip = zip;
        this.zipPath = zipPath;
        this.parentZip = parentZip;
        this.children = children;
    }

    async buffer(){
        return await this.zip.generateAsync({type:"nodebuffer"});
    }

    remove(relative){
        this.zip.remove(relative);
    }

    async file(relative,nodeBuffer){
        this.zip.file(relative,nodeBuffer);
        if(this.parentZip){
            await this.parentZip.file(formatPath(this.zipPath.replace(this.parentZip.zipPath,'')),await this.zip.generateAsync({type:'nodebuffer'}));
        }
    }

    save(rootZipTargetPath){
        return new Promise((resolve,reject)=>{
            if(this.parentZip) {
                resolve(this.parentZip.save(rootZipTargetPath));
            }else{
                this.zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
                    .pipe(fs.createWriteStream(rootZipTargetPath))
                    .on('finish', ()=>resolve());
            }
        });
    }
}

