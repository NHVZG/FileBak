import JSZip from "jszip";
import fs from "fs";
import {read} from "fs-extra";
import {resolve} from "@babel/core/lib/vendor/import-meta-resolve.js";
import path from "path";

var zip=new JSZip();

/*fs.readFile("D:/Screenshot_20230201214717.jpg", function (err, data) {
    var zip = new JSZip();

    zip.loadAsync(data).then(function(zip){
        console.log(zip);
    })
});*/

//D:/Home/Downloads/SQLEncryptDecrypt.zip   bin


fs.readFile("D:/Home/Downloads/test/a.zip", function (err, data) {
    if (err) throw err;
    var zip = new JSZip();
    zip.loadAsync(data)
        .then(function (zip) {
            console.log(zip.files);
            // src/file.txt
            // example.txt
            //console.log(zip.files["example.txt"].unsafeOriginalName);
            // "../../example.txt"
            zip.folder("a").forEach(function (relativePath, file){
                if(file.name==='a/b.zip'){
                    new JSZip().loadAsync(file._data.compressedContent).then(function(zip1){
                        console.log(zip1);
                    });
                }

                console.log("iterating over", relativePath);
            });
        });
});


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

//, 提取zip
unzip();

//, 遍历嵌套zip
//D:/Home/Downloads/test/a.zip/a/b.zip/b
//let fileList=await zipList('D:/Home/Downloads/test/a.zip/a/b.zip');
//console.log(JSON.stringify(fileList,null,4));