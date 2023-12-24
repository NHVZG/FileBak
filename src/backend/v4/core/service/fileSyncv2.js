import {
    Handler,
    initBaseRule,
    Node,
    Rule,
    RuleBundle,
    treeByPath,
    trees
} from "@/backend/v4/core/module/fileDiff/fileDiff";
import {
    dir,
    lstat,
    formatPath,
    chunkBuffer,
    chunkFile,
    bufferPath,
    writeBuffer,
    mergeFile,
    clearBufferPath,
    checkHash,
    newZip,
    hashFile,
    deleteFile,
    ZipEntry,
    hashBuffer,
    mergeZips,
    mergeZip2Dir
} from "@/backend/v4/core/module/files/filesv2";
import {FILE_TYPE} from "@/backend/v4/core/constant/constant";
import {RULE_CONFIGS} from "@/backend/v4/core/module/fileDiff/fileDiff";
import path from "path";
import fs from "fs";
import JSZip from "jszip";
import {resolve} from "@babel/core/lib/vendor/import-meta-resolve.js";
import * as  fse from 'fs-extra'


let key=undefined;

//.规则分组，取最接近根部的config.base，为了剪枝减少不必要节点遍历
function groupConfigs(configs){
    let map={};
    for(let config of configs){
        let pushed=false;
        let base=formatPath(config.base);
        for(let path of Object.keys(map)){
            path=formatPath(path);
            if(path===base){
                map[base].push(config);
                pushed=true;
            }else if(path.startsWith(base)){
                map[base]=(map[base]||[]);
                map[base].push(config);
                map[base]=map[base].concat(map[path]||[]);
                delete map[path];
                pushed=true;
            }
            else if(base.startsWith(path)){
                map[path]=(map[path]||[]);
                map[path].push(config);
                map[path]=map[path].concat(map[base]||[]);
                delete map[base];
                pushed=true;
            }
        }
        if(!pushed){
            map[base]=[config];
        }
    }
    return map;
}

/*
,1. 目标在压缩包中，源文件在压缩包或普通文件的需要整合成压缩包发送（不遍历子压缩包）,按目标根压缩包路径分组传输
,1-1. zip=true，如果目标压缩包存在则(⭕忽略传输   🔴新增)
, 2. 目标为普通文件
, 2-1. 目录忽略
, 2-2. 如接收端非经过压缩包，则创建目录
, 2-3. ⭕压缩包中的文件映射为普通文件，则提取文件夹中所有文件成新压缩包 传输后解压（不遍历子压缩包）🔴场景少，单个传输
*/

//. 初始化传输列表-上传方
async function listUploadFiles(configs){
    let fileList=[];
    let ruleMap=groupConfigs(configs);
    for(let entry of Object.entries(ruleMap)){
        let basePath=entry[0];
        let ruleConfigs=entry[1];
        let handler=new ListUploadHandler(basePath,ruleConfigs);
        let root,leaf,parent;
        if(!basePath&&basePath==='/'){
            root=leaf=parent=new Node();
        }else{
            ({root,leaf,parent}=treeByPath(basePath, FILE_TYPE.DIRECTORY, false));
        }
        let forest=new Node('root','',1);
        let pns=[{root:root,node:parent}]; //, forest 是pn中的一支
        await trees(parent,pns,forest,new Node(),initBaseRule(configs,key),key,handler);
        fileList=fileList.concat(handler.fileList);
    }
    return fileList;
}

//. 审核传输列表-接收方
async function auditingUploadFiles(fileList){
    let forest=[];
    let receiveFileList = [];
    for(let file of fileList){
        if(!file.target)continue;
        if(!file.inherit){
            let rootName=file.target.includes('/')?file.target.substring(0,file.target.indexOf('/')):file.target;
            let tree=forest.find(t=>t.name===rootName);
            let mode=file.ruleList&&file.ruleList.length>0?file.ruleList[0]:file.mode;
            let buildTree=buildRuleNodeTree(file.target,mode,tree);
            if(buildTree&&(!forest.includes(buildTree)))forest.push(buildTree);
        }
        let fileItem=await lstat(file.target);
        if(fileItem&&fileItem.rootZipEntry){                    //, 根zip一致的分组
            file.targetZipPath=fileItem.rootZipEntry.zipPath;
        }
        //if(file.zip&&(!file.inherit)&&fileItem)continue; //,1-1
        if (file.type===FILE_TYPE.DIRECTORY) continue;//,2-1
        if (fileItem && file.mode === 'increment') {  //, 模式为新增且文件已存在则不传输
            continue;
        } else if (fileItem && file.mode === 'mapping') { //, 仅映射未配置规则且文件存在的不传输
            continue;
        }
        receiveFileList.push(file);
    }
    return {receiveFileList,forest};
}

//. 构建规则树
function buildRuleNodeTree(relative,mode,tree,parent){
    let name=relative.includes('/')?relative.substring(0,relative.indexOf('/')):relative;
    let subRelative=relative===name?'':relative.substring(relative.indexOf('/')+1);
    let node=parent?parent.children.find(c=>c.name===name):null;
    if(!parent&&tree){
        node=tree;
    }
    if(!node){
        let filePath=parent?formatPath(parent.path,name):name;
        node=new RuleNode(name,filePath,parent?parent.mode:null,parent);
        if(parent)parent.children.push(node);
    }
    if(!tree)tree=node;
    if(!parent)parent=tree;
    if(!subRelative){
        node.mode=mode;
        //, 取最接近根节点的cover规则
        if(mode==='cover'){
            let covers= new Set();
            let append=true;
            for(let c of tree.covers){
                if(c.path.startsWith(node.path)){//, 新节点覆盖已有cover
                    covers.add(node);
                    append=false;
                }else{
                    covers.add(c);
                }
            }
            if(append){
                covers.add(node);
            }
            tree.covers=Array.from(covers);
        }
        return tree;
    }
    return buildRuleNodeTree(subRelative,mode,tree,node);
}


//.审核清单再整理-上传方
function cleanAuditingFiles(fileList){
    let zipSet={};
    let uploadFileItems=[];
    for(let file of fileList){
        if(file.targetZipPath){                 //, 打包zip 或 接收端已有zip中
            if(!zipSet[file.targetZipPath]){
                zipSet[file.targetZipPath]=[];
            }
            zipSet[file.targetZipPath].push(file);
        }else{
            uploadFileItems.push(new UploadItem([file],file.target,file.inZip,file.zip));
        }
    }
    for(let e of Object.entries(zipSet)){
        let zipPath=e[0];
        let fileList=e[1];
        uploadFileItems.push(new UploadItem(fileList,zipPath,false,fileList.some(f=>f.zip)));
    }
    return uploadFileItems;
}


//,{ zipEntry,files:[{zipEntry,files},{data,name}] }
//. 上传
async function upload(fileItem,onChunk){
    if(fileItem.source.length===1){//, 单个文件传输
        let file=await lstat(fileItem.source[0].source);
        if(!file)return {code:-1,msg:'文件未找到'};
        if(file.zipEntry){
            let data=await file.zipData();
            await chunkBuffer(data,fileItem.target,onChunk);
        }else{
            await chunkFile(fileItem.source[0].source,fileItem.target,onChunk);
        }
    }else{//,zip传输
        let zipMap={};//, 减少zip文件访问
        let zip = new JSZip();
        let zipEntries={};//, zip中嵌套的zip，如果子zip中有文件，则将zip视为文件夹（不保留嵌套zip），如无子文件则写为zip文件
        let normalFiles=[];     //,非zip文件
        for(let source of fileItem.source){
            let entry=source.sourceInZip?Object.values(zipMap).find(e=>source.source.startsWith(e[0])):null;
            let rootZipEntry=entry?entry[1]:entry;
            let file=await lstat(source.source,false,rootZipEntry);
            if(!file)continue;
            if(file.type===FILE_TYPE.ZIP){
                zipEntries[file.path]={data:await file.zipData(),relative:formatPath(source.target.replace(fileItem.target,''))};
            }else{
                normalFiles.push(source);
            }
        }
        for(let source of normalFiles){
            let entry=source.sourceInZip?Object.values(zipMap).find(e=>source.source.startsWith(e[0])):null;
            let rootZipEntry=entry?entry[1]:entry;
            let file=await lstat(source.source,false,rootZipEntry);
            if(!file)continue;
            if(file.rootZipEntry){
                zipMap[file.rootZipEntry.zipPath]=file.rootZipEntry;
            }
            Object.entries(zipEntries)
                .filter(e=>file.path.startsWith(e[0]))
                .map(e=>delete zipEntries[e[0]]);
            if(file.zipEntry){
                zip.file(formatPath(source.target.replace(fileItem.target,'')),await file.zipData());
            }else{
                zip.file(formatPath(source.target.replace(fileItem.target,'')),await fs.readFileSync(source.source));
            }
            /*if(file.zipEntry){
                zip.file(formatPath(source.target.replace(fileItem.target,'')),await file.zipData());
            }else{
                zip.file(formatPath(source.target.replace(fileItem.target,'')),await fs.readFileSync(source.source));
            }*/
        }
        for(let e of Object.entries(zipEntries)){//, 没有子文件的zip写入
            zip.file(e[1].relative,e[1].data);
        }
        zip.generateAsync({type:"nodebuffer"}).then(bf=>{
            chunkBuffer(bf,fileItem.target,onChunk);
        });
    }
}


function receive(chunk,fileItem){
    return new Promise(async (resolve,reject)=>{
        if(chunk.chunkStr&&(!checkHash(chunk.chunkStr,chunk.chunkHash))){
            reject('文件切片校验失败！');
            return;
        }
        if(chunk.idx===1&&chunk.end){
            //await writeBuffer(chunk.chunkStr,chunk.path);
            //resolve({state:'finish',id:chunk.id});
            await saveFile(chunk,fileItem,false)
                .then(()=>resolve({state:'finish',id:chunk.id}),
                        (err)=>resolve({state:'error',err,id:chunk.id}));
        }else{
            let cachePath=bufferPath(chunk.id);
            writeBuffer(chunk.chunkStr,`${cachePath}/${chunk.idx}`).then(async()=>{
                if(chunk.end){
                    await saveFile(chunk,fileItem,true)
                        .then(()=>resolve({state:'finish',id:chunk.id}),
                                (err)=>resolve({state:'error',err,id:chunk.id}));
                    //let fileList=await dir(cachePath);
                    //let files=fileList.sort((a,b)=>a.name-b.name).map(f=>f.path);
                    //await mergeFile(chunk.path,files);
                    //clearBufferPath(chunk.id);
                    //resolve({state:'finish',id:chunk.id});
                }else{
                    resolve({state:'partial',id:chunk.id});
                }
            });
        }
    });
}

async function saveFile(chunk,fileItem,merge){
    let tempRootPath=bufferPath(chunk.id);
    return new Promise(async (resolve,reject)=>{
        let tempFile=`${tempRootPath}/temp`;
        let sourceBuffers;
        if(merge){
            let fileList=await dir(bufferPath(chunk.id));
            let files=fileList.sort((a,b)=>a.name-b.name).map(f=>f.path);
            await mergeFile(files,tempFile);
            let hash=await hashFile(tempFile);
            if(hash!==chunk.fileHash){
                clearBufferPath(chunk.id);                                                                  //, 删除缓存
                reject('文件hash校验失败');
                return;
            }
            sourceBuffers=fs.readFileSync(tempFile);
        }else{
            sourceBuffers=Buffer.from(chunk.chunkStr, 'binary');
            let hash=await hashBuffer(sourceBuffers);
            if(hash!==chunk.fileHash){
                clearBufferPath(chunk.id);
                reject('文件hash校验失败');
                return;
            }
        }
        let targetFile=await lstat(fileItem.target,true);
        if(targetFile&&targetFile.exist&&(targetFile.type===FILE_TYPE.ZIP||targetFile.rootZipEntry)){//,  目标在zip中 则合并zip
            let bakZipPath=`${targetFile.rootZipEntry.zipPath}.bak_${new Date().getTime()}`;
            fs.renameSync(targetFile.rootZipEntry.zipPath,bakZipPath);
            try{
                if (fileItem.zip) {
                    let zip = new JSZip();
                    if (targetFile.rootZipEntry.zipPath === fileItem.target) {
                        await mergeZips(null, null, await zip.loadAsync(sourceBuffers), targetFile.rootZipEntry.buffer());
                    } else {
                        let relative = formatPath(fileItem.target.replace(targetFile.rootZipEntry.zipPath,''));
                        if (relative) {
                            zip.file(relative, sourceBuffers);
                            await mergeZips(null, null, await zip.loadAsync(sourceBuffers), targetFile.rootZipEntry.buffer());
                        }
                    }
                }else{
                    targetFile.zipEntry.file(fileItem.target.replace(targetFile.zipEntry.zipPath,''),sourceBuffers);
                    targetFile.zipEntry.save(targetFile.rootZipEntry.zipPath);
                }
            } catch (err) {
                deleteFile(targetFile.rootZipEntry.zipPath);
                fs.renameSync(bakZipPath, targetFile.rootZipEntry.zipPath);
            } finally {
                clearBufferPath(chunk.id);
            }
        }else if(targetFile&&targetFile.exist&&targetFile.type===FILE_TYPE.DIRECTORY){//, 目标文件夹 源文件为zip的解压
            if(fileItem.zip){
                await mergeZip2Dir(await new JSZip().loadAsync(sourceBuffers),fileItem.target);
            }else{
                let children=await dir(fileItem.target);
                if(!children&&children.length===0){                                               //, 如果目标路径是文件夹且空的再覆盖成文件 否则跳过
                    deleteFile(fileItem.target);
                    fs.writeFileSync(fileItem.target,sourceBuffers);
                }
            }
        }else{//, 已存在文件（非zip）
            if(!targetFile||(!targetFile.exist)){//, 判断路径是否被叶节点占用，路径存在叶节点为路径冲突退出
                let parent = formatPath(fileItem.target);
                outer:while ((parent = path.dirname(parent)) !== '.') {
                    let fileItem;
                    if (!(fileItem = await lstat(parent))) continue;
                    switch (fileItem.type){
                        case FILE_TYPE.DIRECTORY:
                        case FILE_TYPE.DRIVER:           break outer;                                                                                                                         //, 查找路径存在叶节点为路径冲突退出
                        default:                                    resolve();return;
                    }
                }
            }
            fse.ensureDirSync(path.dirname(fileItem.target));
            fs.writeFileSync(fileItem.target,sourceBuffers);
        }
        resolve();
    });
}




//. 格式化cover树
function serializeTree(data){
    return JSON.stringify(data,(k,v)=>{
        switch(k){
            case 'name':return v;
            case 'path':return v;
            case 'parent':return undefined;
            case 'children':return v;
            case 'mode':return v;
            default:return v;
        }
    })
}




//%传输项
class UploadItem{
    source=[];
    //unzip=false;          //,废弃 解压用映射实现
    target;
    zip;

    constructor(source= [], target,unzip=false,zip) {
        this.source = source;
        //this.unzip = unzip;
        this.target = target;
        this.zip = zip;
    }


}

//% tress 遍历处理器
class ListUploadHandler{
    constructor(basePath,ruleConfigs) {
        this.basePath=basePath;
        this.ruleConfigs=ruleConfigs;
        this.fileList=[];
    }
    async children(pb){
        if(pb.path===path.dirname(this.basePath)){  //, 配置base的上一层，由于base有可能有兄弟节点，需要单独处理，只遍历base
            let rootBase=await lstat(this.basePath);
            return rootBase?[rootBase]:[];
        }
        switch (pb.type){
            case FILE_TYPE.DIRECTORY:break;
            case FILE_TYPE.ZIP: if(this.ruleConfigs.some(r=>(r.base.startsWith(pb.path)||pb.path.startsWith(r.base))&&r.through))break; else return [];     //, 决定是否遍历zip节点
            default: return [];
        }
        let children=await dir(pb.path);
        return children||[];
    }

    after(base,leaf,forest,source, {maps, checks},key){
        let cur=source.rules.cur(key);
        switch (cur.config.mode){
            case 'except':
            case 'remove':
            case 'normal':return false;
        }
        leaf.map(n=>{
            if(n.node.rules.cur().config.mode==='normal')return;
            let ruleList=n.node.rules.get().filter(r=>r.config.mode!=='normal'&&r.config.mode!=='mapping').map(r=>r.config.mode);

            let zipRule=n.node.rules.get().find(r=>r.config.zip);        //, 查找映射为zip规则
            this.fileList.push({
                sourceInZip:source.inZip,
                source:source.path,
                target:n.node.path,
                type:n.node.type,
                ruleList,                                                                      //, 非路径映射规则
                zip:zipRule?true:false,
                targetZipPath:zipRule?zipRule.config.target:null,            //, 规则映射的目标zip路径
                inZip: n.node.inZip,
                inherit: n.node.rules.cur().inherit,                                 //,是否继承的规则，cover规则时取第一级处理
                mode: n.node.rules.cur().config.mode,                        //, 首要生效规则
            });

        });
        return true;
    }
}

//% ![](cover模式规则.jpg)
//% 根节点为cover模式
class RuleNode{
    name;                        //, 节点名称
    path;                         //, 节点绝对路径
    mode;
    parent;
    children=[];                //, 便于构建嵌套规则树的子节点（同种规则拥有子节点）
    covers=[];                  //,覆盖规则最近子节点

    constructor(name, path, mode, parent, children= [], covers=[]) {
        this.name = name;
        this.path = path;
        this.mode = mode;
        this.parent = parent;
        this.children = children;
        this.covers = covers;
    }
}



export {
    listUploadFiles,
    auditingUploadFiles,
    serializeTree,
    cleanAuditingFiles,

    upload,
    receive
}


