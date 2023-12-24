import {
    Handler,
    initBaseRule,
    Node,
    Rule,
    RuleBundle,
    treeByPath,
    trees
} from "@/backend/v4/core/module/fileDiff/fileDiff";
import {dir, fileInfo,formatPath} from "@/backend/v4/core/module/files/files";
import {FILE_TYPE} from "@/backend/v4/core/constant/constant";
import {RULE_CONFIGS} from "@/backend/v4/core/module/fileDiff/fileDiff";
import path from "path";
import fs from "fs";
import JSZip from "jszip";

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



let key=undefined;



//. 初始化传输列表-上传方
async function listFileTransport(configs){
    let fileList=[];
    let ruleMap=groupConfigs(configs);
    for(let entry of Object.entries(ruleMap)){
        let basePath=entry[0];
        let ruleConfigs=entry[1];
        let parentPath=path.dirname(basePath);

        let handler=new Handler(async (pb)=>{
            if(pb.path===parentPath){
                let rootBase=fileInfo(basePath);
                return rootBase?[rootBase]:[];
            }
            let dirZip=pb.type===FILE_TYPE.ZIP&&ruleConfigs.some(r=>r.through&&r.base===pb.path);
            if(pb.type!==FILE_TYPE.DIRECTORY&&!dirZip)return [];        //, 文件夹且zip再取子节点
            let children=await dir(pb.path);
            return children||[];
        },(base,leaf,forest,source, {maps, checks},key)=>{
            let cur=source.rules.cur(key);
            if(cur.config.mode==='except'||cur.config.mode==='remove'||cur.config.mode==='normal')return false;
            leaf.map(n=>{
                if(n.node.rules.cur().config.mode!=='normal') {
                    let nonMappingMode = '';
                    for (let rule of n.node.rules.get()) {
                        if (rule.config.mode === 'normal' || rule.config.mode === 'mapping') continue;
                        nonMappingMode = rule.config.mode;
                        break;
                    }
                    fileList.push({
                        sourceName:source.name,
                        targetName:n.node.name,
                        source: source.path,
                        target: n.node.path,
                        mode: n.node.rules.cur().config.mode,                                      //, 首要生效规则
                        nonMappingMode,                                                                  //, 非路径映射的首要生效规则
                        directory: n.node.type === FILE_TYPE.DIRECTORY,
                        zip: n.node.type === FILE_TYPE.ZIP,
                        inZip: n.node.inZip,
                        inherit: n.node.rules.cur().inherit                                               //,是否继承的规则，cover规则时取第一级处理
                    });
                }
            });
            return true;
        });


        let root,leaf,parent;
        if(!basePath&&basePath==='/'){
            root=leaf=parent=new Node();
        }else{
            ({root,leaf,parent}=treeByPath(basePath, FILE_TYPE.DIRECTORY, false));
        }
        let forest=new Node('root','',1);
        let pns=[{root:root,node:parent}]; //, forest 是pn中的一支

        //await trees(parent,pns,forest,new Node(),initBaseRule(ruleConfigs,key),key,handler);
        await trees(parent,pns,forest,new Node(),initBaseRule(configs,key),key,handler);
    }
    return fileList;
}


//. 审核传输列表-接收方
function auditingSynFileList(fileList) {
    let trees=[];
    let receiveFileList = [];
    for (let file of fileList) {
        if(!file.target)continue;
        if(!file.inherit){
            let rootName=file.target.indexOf('/')>0?file.target.substring(0,file.target.indexOf('/')):path;
            let tree=trees.find(t=>t.name===rootName);
            let buildTree=buildTrees(file.target,file.nonMappingMode,null,null,tree,tree);
            if(!tree)trees.push(buildTree);
        }
        if (file.directory) {
            continue;
        }
        let exist = fs.existsSync(file.target);
        if (exist && file.mode === 'increment') {  //, 模式为新增且文件已存在则不传输
            continue;
        } else if (exist && file.mode === 'mapping') { //, 仅映射未配置规则且文件存在的不传输
            continue;
        }
        receiveFileList.push(file);
    }
    return {receiveFileList,trees};
}

//. 构建规则树
function buildTrees(relative,mode,absolut,parent,pNode,tree,coverNode){
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

function serializeTree(data){
    return JSON.stringify(data,(k,v)=>{
        switch(k){
            case 'name':return v;
            case 'path':return v;
            case 'parent':return undefined;
            case 'children':return undefined;
            case 'pNode':return undefined;
            case 'mode':return v;
            case 'nodes':return v;
            default:return v;
        }
    })
}


function findMountNode(path,tree,parent){
    let p=parent||tree;
    let match=parent.children.find(c=>c.path===path);
    if(!match) return p;
    let relativePath=path.substring(path.indexOf('/'));
    return findMountNode(relativePath,tree,match);
}

function buildTree(relative,mode,absolut='',parent,tree){
    let name=relative.substring(0,relative.indexOf('/'));
    let subRelative=relative.substring(relative.indexOf('/'));
    let node=new RuleNode(name,formatPath(absolut,name),parent,[]);
    if(parent){
        parent.children.push(node);
    }
    if(!tree)tree=node;
    if(!subRelative)return tree;
    return buildTree(subRelative,mode,node.path,node,tree);
}


//` 1.txt   ->  1.txt
//` 1.txt  -> a.zip/1.txt
//` a.zip/1.txt -> 1.txt
//` a.zip/1.txt -> b.zip/1.txt


//% ![](cover模式规则.jpg)
//% 根节点为cover模式
class RuleNode{
    name;                        //, 节点名称
    path;                         //, 节点绝对路径
    mode;
    parent;
    children=[];                //, 便于构建嵌套规则树的子节点（同种模式拥有子节点）
    nodes=[];                   //, 规则匹配节点，删除文件时遍历的子节点（仅存规则匹配非继承节点 子节点和父节点可能相同规则）
    pNode;                      //, 前一个 规则匹配节点，双向链表
    covers=[];                  //,覆盖规则最近子节点

    constructor(name, path, mode, parent, children= [], nodes= [], pNode,covers=[]) {
        this.name = name;
        this.path = path;
        this.mode = mode;
        this.parent = parent;
        this.children = children;
        this.nodes = nodes;
        this.pNode = pNode;
        this.covers = covers;
    }
}


export {
    listFileTransport,
    auditingSynFileList,
    serializeTree
}


