import fs from "fs";
import crypto from "crypto";
import path from "path";
import fse from 'fs-extra/esm'
import JSZip from "jszip";
/*

// the file you want to get the hash
var fd = fs.createReadStream('D:/DASS-114.mp4');
var hash = crypto.createHash('sha256');
hash.setEncoding('hex');

fd.on('end', function() {
    hash.end();
    console.log(hash.read()); // the desired sha1sum
});

// read all file and pipe it (write it) to the hash object
fd.pipe(hash);

*/

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
    let TempDir='C:/Users/NHVZG/AppData/Local/Temp';   //, 系统缓存目录
    let cacheDir=`${TempDir}/fileBak`;
    if (!fs.existsSync(cacheDir)){
        fs.mkdirSync(cacheDir);
    }
    const readStream = fs.createReadStream(sourcePath,{highWaterMark:1024*1024*20});
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
    /*for(let file of files){
        fs.appendFileSync(targetFilePath, fs.readFileSync(file));
    }*/
    return new Promise((resolve,reject)=>{
        let  w = fs.createWriteStream(targetFilePath);//, {flags: 'a'}
        let nextStep=()=>{
            w.close();
            resolve();
        }
        for(let i=files.length-1;i>-1;i--){
            nextStep=merge(files[i],w,nextStep);
        }
        nextStep();
    });
    /*w.on('close', function() {
        console.log("done writing");
    });*/
}

function removeDir(directory){
    fs.rmSync(directory, { recursive: true, force: true });
}

function fileTransfer() {
    let fileList = [];
    let resolve = data => {
        if (data.end) {
            console.log(new Date().getTime());
            mergeFile(`D:/Home/Downloads/test1/${data.name}`, fileList)
                .then(() => {
                    console.log(new Date().getTime());
                    removeDir(`D:/Home/Downloads/test1/${data.id}`);
                });
            console.log(`end:${data.hash},${data.length}`);
            return;
        }
        console.log(`${data.idx}-${data.hash}:${checkHash(data.chunkStr, data.hash)}`);
        let chunkFilePath = `D:/Home/Downloads/test1/${data.id}/${data.idx}`;
        fileList.push(chunkFilePath);
        writeBuffer(data.chunkStr, chunkFilePath)
    }
    chunkFile(
        'D:/Home/Downloads/JHenTai_7.4.5+144_Windows.zip',
        'D:/Home/Downloads/test/JHenTai_7.4.5+144_Windows.zip',
        resolve);
}

//fileTransfer();


/*
console.log(path.dirname('asd/d/2/'));
console.log(path.dirname('asd/d///'));
console.log(path.normalize('asd/d///'));*/

//let co=fs.lstatSync('D:/Home/Downloads/JHenTai_7.4.5+144_Windows.zip');

//console.log(fs.readdirSync('/'))

//fs.cpSync('', '', {recursive: true});

/*
.  复制自定义

fse.copy('D:/Test/base','D:/Home/Downloads/test1/base',{
    filter:path=>{
        return !path.includes('c');
    }
});

*/


