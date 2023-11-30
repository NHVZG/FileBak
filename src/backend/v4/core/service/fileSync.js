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



let configs=[
    {base: 'D:/Test/base', relative: '', target: 'D:/Test/compared', mode: 'mapping'},
    {base: 'D:/Test/base', relative: 'a.txt', target: 'D:/Test/compared/d.txt', mode: 'mapping',pruning:true},
    {base: 'D:/Test/base/b', relative: 'a.bmp', target: 'D:/Test/compared/x.txt', mode: 'mapping',pruning:true},
    //{base: 'D:/Test/compared/d.txt', relative: '', mode: 'incrementUpdate',dispatch:Rule.DISPATCH_TARGET},
    {base: 'D:/Test/base/a/a.txt', relative: '', mode: 'increment'},

    {base: 'D:/Test/base/a.zip', relative:'a', mode: 'mapping', target:'D:/Test/compared/x.zip',through:true,zip:true,pruning: true},
    //{base: 'D:/Test/base/a.zip/a', relative: '', mode: 'mapping', target:'D:/Test/compared/azip',through:true},
    //{base: 'D:/Test/compared/azip', relative: '', mode: 'incrementUpdate', through:true,dispatch:Rule.DISPATCH_TARGET},

    {base: 'D:/Test/base/c.txt', relative: '', mode: 'update'},
    {base: 'D:/Test/base/b/bb', relative: '', mode: 'cover'},
    {base: 'D:/Test/base/b/bb/b.bmp', target: 'D:/Test/compared/b/bb/x.bmp', mode: 'mapping'},
    {base: 'D:/Test/base/c', relative: '',target: 'D:/Test/compared/从', mode: 'mapping',pruning:true},
    {base: 'D:/Test/compared/从', relative: '', mode: 'increment',dispatch:Rule.DISPATCH_TARGET},
    //{base: 'D:/Test/base', relative: 'b.txt', target: 'D:/Test/compared/d.txt', mode: 'mapping'},
    //{base: 'D:/Test/compared', mode: 'increment'},
];
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
            if(pb.type!==FILE_TYPE.DIRECTORY&&pb.type!==FILE_TYPE.ZIP)return [];        //, 文件夹且zip再取子节点
            let children=await dir(pb.path);
            return children||[];
        },(base,leaf,forest,source, {maps, checks},key)=>{
            let cur=source.rules.cur(key);
            if(cur.config.mode==='except'||cur.config.mode==='remove'||cur.config.mode==='normal')return false;
            leaf.map(n=>{
                if(n.node.rules.cur().config.mode!=='normal')
                fileList.push({
                    source:source.path,
                    target:n.node.path,
                    mode:n.node.rules.cur().config.mode,
                    directory:n.node.type===FILE_TYPE.DIRECTORY,
                    zip:n.node.type===FILE_TYPE.ZIP,
                    inZip:n.node.inZip,
                    inherit:n.node.rules.cur().inherit                                                              //,是否继承的规则，cover规则时取第一级处理
                });
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
    let nonCoverRootFiles=[];       //, 所有非cover规则匹配的节点（非继承）
    let coverRootFiles=[];              //, 记录所有cover规则匹配的节点（非继承）


    let receiveFileList = [];
    for (let file of fileList) {
        if(!file.target)continue;
        if(!file.inherit){
            (file.mode==='cover'?coverRootFiles:nonCoverRootFiles).push(file);
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




}

//% ![](cover模式规则.jpg)
//% cover模式嵌套目录 需要清理目录多余文件，存储最顶层的节点
class CoverNode{
    filePath;
    children=[];
}


export {
    listFileTransport
}


