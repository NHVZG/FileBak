import JSZip from "jszip";
import fs from "fs";
import {read} from "fs-extra";
import {resolve} from "@babel/core/lib/vendor/import-meta-resolve.js";
import path from "path";
import fse from 'fs-extra/esm'

function formatPath(...path){
    return path.join('/').replaceAll(/\/+/gm, '/').replaceAll(/\/$/gm,'').replace(/^\//,'');
}

const FILE_TYPE={
    DRIVER:0,                 //, 驱动器
    DIRECTORY:1,          //, 文件夹
    FILE:2,                       //, 文件
    SYMBOL:3,               //, 软连接
    ZIP:4,                       //, 压缩包
};

async function isZip(data){
    try{
        await new JSZip().loadAsync(data);
        return true;
    }catch (err){
        //,非可读zip文件 跳过，认为冲突
        return false;
    }
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

function deleteFile(path){
    fse.removeSync(path);
}



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



await mergeZip2Dir(await new JSZip().loadAsync(await fs.readFileSync("D:/Test/1/c.zip")),"D:/Test/2");
console.log(5);
//let s=await lstat("D:");
//console.log(s);
