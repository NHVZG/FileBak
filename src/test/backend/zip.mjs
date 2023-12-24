import JSZip from "jszip";
import fs from "fs";
import {read} from "fs-extra";
import {resolve} from "@babel/core/lib/vendor/import-meta-resolve.js";
import path from "path";
import fse from 'fs-extra/esm'
import crypto from "crypto";

var zip=new JSZip();

/*fs.readFile("D:/Screenshot_20230201214717.jpg", function (err, data) {
    var zip = new JSZip();

    zip.loadAsync(data).then(function(zip){
        console.log(zip);
    })
});*/

//D:/Home/Downloads/SQLEncryptDecrypt.zip   bin

//D:/Home/Downloads/test/1107094.jpg
/*fs.readFile("D:/Home/Downloads/test/a.zip", function (err, data) {
    if (err) throw err;
    var zip = new JSZip();
    zip.loadAsync(data)
        .then(function (zip) {
            console.log(zip.files);
            // src/file.txt
            // example.txt
            //console.log(zip.files["example.txt"].unsafeOriginalName);
            // "../../example.txt"
            zip.forEach(x=>{
                console.log(x);
            });

            zip.folder("a").forEach(function (relativePath, file){
                if(file.name==='a/b.zip'){
                    new JSZip().loadAsync(file._data.compressedContent).then(function(zip1){
                        console.log(zip1);
                    });
                }

                console.log("iterating over", relativePath);
            });
        },function (err){
            console.log(err);
        });
});*/


function formatPath(...path){
    return path.join('/').replaceAll(/\/+/gm, '/').replaceAll(/\/$/gm,'').replace(/^\//,'');
}




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
                let idx=0;
                fileEntry=relativePath==='.'||relativePath===''?zip:zip.folder(relativePath);
                let folderPath=relativePath==='.'||relativePath===''?'':relativePath;
                fileEntry.forEach((filePath,file)=>{
                    let directory=filePath.substring(0,filePath.indexOf('/'));
                    let fileName=directory?directory:filePath;
                    if(set.has(fileName))return;
                    set.add(fileName);
                    fileList.push({
                        path:formatPath(`${absolutePath}/${folderPath}/${fileName}`),
                        name:fileName,
                        type:1,
                        idx:idx++,
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


function unzip(){
    fs.readFile("D:/Home/Downloads/test/a.zip", function (err, data) {
        if (err) throw err;
        var zip = new JSZip();
        zip.loadAsync(data)
        .then(function (zip) {
            zip.folder("a").generateAsync({type:"nodebuffer"}).then((content)=>{
                fs.writeFileSync('D:/Home/Downloads/test/x/a',content);
            })


            zip.folder("a").forEach(function (relativePath, file){
                if(file.name==='a/b.zip'){
                    new JSZip().loadAsync(file._data.compressedContent).then(function(zip1){
                        zip1.forEach((f,fileEntry)=>{
                            if(f==='b/d/1107094.jpg'){
                                zip1.file(f).async('nodebuffer').then(content=>{
                                    fs.writeFileSync('D:/Home/Downloads/test/1107094.jpg',content);
                                });
                            }
                        });
                    });
                }
                console.log("iterating over", relativePath);
            });
        });
    });
}

function addZip(){
    fs.readFile("D:/Home/Downloads/test/a.zip", function (err, data) {
        if (err) throw err;
        var zip = new JSZip();
        zip.loadAsync(data)
            .then(function (zip) {
                fs.readFile("D:/Home/Picture/壁纸/1107094.jpg",function(err,bf){
                    zip.file("xxxx/test/test.jpg",bf);
                    zip
                        .generateNodeStream({type:'nodebuffer',streamFiles:true})
                        .pipe(fs.createWriteStream('D:/Test/base/out.zip'))
                        .on('finish', function () {
                            // JSZip generates a readable stream with a "end" event,
                            // but is piped here in a writable stream which emits a "finish" event.
                            console.log("out.zip written.");
                        });
                });
            });

    });
}

function addNestedZip(){
    fs.readFile("D:/Home/Downloads/test/a.zip", function (err, data) {
        if (err) throw err;
        var zip = new JSZip();
        zip.loadAsync(data)
            .then(function (zip) {
                zip.folder("a").forEach(function (relativePath, file){
                    if(file.name==='a/b.zip'){
                        new JSZip().loadAsync(file._data.compressedContent).then(function(zip1){
                            fs.readFile("D:/Home/Picture/壁纸/1107094.jpg",async function(err,bf){
                                zip1.file("xxxx/test/test.jpg",bf);

                                const content=await zip1.generateAsync({type:'nodebuffer'});
                                zip.file("a/b.zip",content);
                                zip
                                    .generateNodeStream({type:'nodebuffer',streamFiles:true})
                                    .pipe(fs.createWriteStream('D:/Home/Downloads/test/addZip/out.zip'))
                                    .on('finish', function () {
                                        // JSZip generates a readable stream with a "end" event,
                                        // but is piped here in a writable stream which emits a "finish" event.
                                        console.log("out.zip written.");
                                    });
                            });
                        });
                    }
                });
            });
    });
}





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
                return resolve(await zips(relativePath,absolutPath,fileEntry._data.compressedContent));
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



function dirs(base) {
    return zips(base).then(({data, absolut, zip, entry, relative}) => {
        let set = new Set();
        let fileList = [];
        let typeMap = {};
        let folderPath = relative === '.' || relative === '' ? '' : relative;
        if(!entry||(!entry.forEach))return fileList;
        entry.forEach((filePath, file) => {
            let directory = filePath.substring(0, filePath.indexOf('/'));
            let fileName = directory ? directory : filePath;
            if (set.has(fileName)) return;
            set.add(fileName);
            let type;
            if (directory) {
                type = 1;
            } else if (fileName.endsWith('.zip') && file._data.compressedContent) {
                type = 4;
            } else {
                type = 2;
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

function unzips(base){
    return zips(base).then(async ({data, absolut, zip, entry, relative}) => {
        let content=await data();
        if(content) {
            fs.writeFileSync('D:/Home/Downloads/test/unzip/'+path.basename(absolut), content);
        }
    });
}

function zipsv3(path){
    fs.readFile(path, function (err, data) {
        if (err) throw err;
        let zip = new JSZip();
        zip.loadAsync(data)
            .then(async function (z1) {
                await z1.file("a/b.zip")
                    .async('nodebuffer')
                    .then(JSZip.loadAsync)
                    .then(z2=>{
                       z2.file("k.zip")
                           .async("nodebuffer")
                           .then(JSZip.loadAsync)
                           .then(z3=>{
                              z3.forEach((p,n)=>{
                                  console.log(p);
                              });
                           });
                    });

                let x = await z1.file("a/b.zip").async('nodebuffer');
                console.log(123);
        });
    });

}


let buffer=fs.readFileSync('D:/Home/Picture/壁纸/meh.ro10441.jpg');
let hash=crypto
    .createHash("sha256")
    .update(new Uint8Array(buffer))
    // .update(Buffer.from(fileBuffer))
    .digest("hex");
console.log(hash);

var fd = fs.createReadStream('D:/Home/Picture/壁纸/meh.ro10441.jpg');
var hash1 = crypto.createHash('sha256');
hash1.setEncoding('hex');
fd.on('end', ()=> {
    hash1.end();
    console.log(hash1.read());
});
fd.pipe(hash1);


function newZip(){
    fse.ensureDirSync('D:/Home/Downloads/test/newZip');
    var zip = new JSZip();
    zip.file("Hello.txt", "Hello World\n");
    fs.readFile("D:/Home/Picture/壁纸/1107094.jpg",async function(err,bf) {
        zip.file("xxxx/test/test.jpg", bf);
        zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
            .pipe(fs.createWriteStream('D:/Home/Downloads/test/newZip/out.zip'))

        zip.generateAsync({type:"nodebuffer"}).then(bf=>{
            console.log(123);
        });
    });
}

async function isZip(data){
    try{
        await new JSZip().loadAsync(data);
        return true;
    }catch (err){
        //,非可读zip文件 跳过，认为冲突
        return false;
    }
}

//v2
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

//v1
function mergeZip(source,target,sb,tb){
    return new Promise(async (resolve,reject)=> {
        let sZip = new JSZip();
        let tZip = new JSZip();
        if(!sb){
            sb = fs.readFileSync(source);
            tb = fs.readFileSync(target);
        }
        let targetZip;
        sZip.loadAsync(sb).then(sz => {
            tZip.loadAsync(tb).then(async tz => {
                targetZip=tz;
                let i=0;
                sz.forEach(async (f, fo) => {
                    if (!tz.file(f)) {
                        await fo.async("nodebuffer").then(bf => tz.file(f, bf));
                    } else if (f.endsWith('.zip') && fo._data.compressedContent) {//,zip遍历
                        let {targetZipBuffer}=await mergeZip(formatPath(source, f), formatPath(target, f),await fo.async("nodebuffer") ,await tz.file(f).async("nodebuffer"));
                        tz.file(f,targetZipBuffer);
                    }else{
                        await fo.async("nodebuffer").then(bf => tz.file(f, bf));
                    }
                    i++;
                    if(i===Object.keys(sz.files).length){
                        resolve({targetZipBuffer:await targetZip.generateAsync({type:"nodebuffer"}),targetZip});
                    }
                });
            });
        });
    });
}



//, 提取zip文件
//unzips("D:/Home/Downloads/test/a.zip/a/b.zip/b/thumb-1920-866196.jpg")
//unzips("D:/Home/Downloads/test/a.zip/a/b.zip/b/d/1107094.jpg")
//unzips("D:/Home/Downloads/test/a.zip/a/b.zip/b/d/1274437.jpg")
//unzips("D:/Home/Downloads/test/a.zip/a/b.zip")
//unzips("D:/Home/Downloads/test/a.zip/a")
//unzips("D:/Home/Downloads/test/a.zip/b")
//unzips("D:/Home/Downloads/test/a.zip/b/ada.txt")

//, 遍历嵌套zip -v2
//dirs('D:/Home/Downloads/test/a.zip/b').then(list=>console.log(list););
//zipsv3('D:/Test/base/a.zip');


//, 添加zip文件
//addZip();
//addNestedZip();

//, 提取zip
//unzip();

//, 遍历嵌套zip
//D:/Home/Downloads/test/a.zip/a/b.zip/b
//let fileList=await zipList('D:/Home/Downloads/test/a.zip/a/b.zip');
//console.log(JSON.stringify(fileList,null,4));

//, 新建zip
//newZip();

//, 合并zip
/*let {targetZip}=await mergeZip('D:\\Test\\compared\\y.zip','D:\\Test\\base\\a.zip');
targetZip
    .generateNodeStream({type:'nodebuffer',streamFiles:true})
    .pipe(fs.createWriteStream('D:\\Test\\compared\\ya.zip'))
console.log(123);*/

let targetZip=await mergeZips('D:\\Test\\1\\a.zip','D:\\Test\\1\\b.zip');
targetZip
    .generateNodeStream({type:'nodebuffer',streamFiles:true})
    .pipe(fs.createWriteStream('D:\\Test\\1\\c.zip'))


//fs.writeFileSync("D:\\Test\\1\\c\\1.js","213");

//, 已存在文件
//fse.ensureDirSync("D:\\Test\\1\\comflict.zip");