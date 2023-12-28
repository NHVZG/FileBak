import {FILE_TYPE} from "@/backend/v4/core/constant/constant";

let RULE_NORMAL={mode: 'normal'};
let RULE_CONFIGS={
    except: {inherit: true, penetrate: true, order: 1},                      //例外 - 穿透 覆盖其他规则
    remove: {inherit: true, penetrate: true, order: 2},                     //删除 - 对远程路径操作
    mapping: {inherit: true, penetrate: false, order: 3},                  //映射
    //. 互斥规则
    update: {inherit: true, penetrate: false, order: 10},                   //更新 - 仅覆盖已有
    increment: {inherit: true, penetrate: false, order: 11},              //新增 - 仅新增文件
    incrementUpdate: {inherit: true, penetrate: false, order: 12},   //更新+新增 - 两种模式的混合
    cover: {inherit: true, penetrate: false, order: 13},                     //覆盖 - 完全与源文件路径一致，删除不在受控内的文件
    normal: {inherit: false, penetrate: false, order: 100}                 //无
};

//% 节点
class Node{
    constructor(name,path,type,inZip=false,children=[],ruleBundle=new RuleBundle(),mainKey) {
        this.name=name;                                      //, 节点名
        this.path=path;                                         //, 路径
        this.type=type;                                          //, 文件类型
        this.inZip=inZip;                                        //, 是否在zip中
        this.children=children;                               //, 子节点[【Node】]
        this.rules=ruleBundle;                                //, 规则集合
        this.mainKey=mainKey;                              //, 主要分组名,保留
        this.leaf=FILE_TYPE.DIRECTORY!==type&&FILE_TYPE.ZIP!==type;
    }

    //. 从节点拷贝信息（规则除外）
    from(base,mainKey){
        this.name=base.name;
        this.path=base.path;
        this.type=base.type;
        this.inZip=base.inZip;
        this.mainKey=mainKey;
        this.rules=new RuleBundle([],mainKey);
        this.leaf=FILE_TYPE.DIRECTORY!==base.type&&FILE_TYPE.ZIP!==base.type;
        return this;
    }

    //.添加子节点
    addNode(node){
        if(node instanceof Array){
            this.children.push(...node);
        }else {
            this.children.push(node);
        }
        return node;
    }

    //. 查找子节点
    find(name){
        return this.children.find(c=>c.name===name);
    }

    //. 合并节点
    merge(target,merges,targetKey,mergeKey){
        if(merges.type===4){
            this.type=4;
        }else if(this.type!==4){
            this.type=Math.min(this.type,merges.type);
        }
        //let hasNormal=this.rules.get(targetKey,[]).some(r=>r.config.mode==='normal');
        let list=this.rules
            .append(
                //hasNormal?merges.rules.get(mergeKey,[]).filter(r=>r.config.mode!=='normal'):
                merges.rules.get(mergeKey,[]),targetKey,false)      //, 合并规则设置规则绑定节点
            .get(targetKey,[])
            .map(r=>{
                r.nodes.target=target;
                r.nodes.merge=merges;
                return r;})
            .filter(r=>r.nodes.source);
        Array
            .from(new Set(list))                                                                 //, 去重
            .map(r=>{
                r.nodes.source.rules
                    .get(mergeKey,[])
                    .map(x=>{
                        if(x.config.mode==='mapping'&&x.config===r.config){
                            x.nodes.target=target;
                        }else if(x.config.mode==='normal'&&r.nodes.source.path===target.path){          //, 普通规则才根据路径设置target(避免覆盖mapping规则的nodes.target)
                            x.nodes.target=target;
                        }});
            });
        return this;
    }

}

//% 规则集合
class RuleBundle{
    constructor(ruleList=[],key) {
        this.ruleMap={};                                                      //, {key:[【RuleItem】]}
        this.mainKey=key||'base';                                        //, 默认分组key
        if(ruleList.length>0){
            this.ruleMap[this.mainKey]=ruleList.slice();
        }
    }

    //. 基础规则
    normal(source,key){
        this.append([RuleItem.instanceNormal(source)],key,false);
        return this;
    }

    //. 匹配规则
    check(checkNode,source,key,matchMode=Rule.DISPATCH_TARGET){
        let rules=this
            .get(key,[])
            .filter(r=>r.config.dispatch===matchMode&&r.test(checkNode))
            .map(r=>r.instanceCheck(source,checkNode));
        return new RuleBundle(rules,key||this.mainKey);
    }

    //. 继承的规则
    inherits(source,key,matchMode){
        let rules=this
            .get(key,[])
            .filter(r=>{
                if(source.inZip&&(!r.config.through))return false;
                if(matchMode&&(matchMode!==r.config.dispatch))return false;
                let conf=this.config(r);
                return conf.penetrate||conf.inherit;  })
            .map(r=>r.instanceInherit(source));
        return new RuleBundle(rules,key||this.mainKey)
    }

    //. 排序map
    sorts(){
        Object.entries(this.ruleMap)
            .map((entry)=>this.ruleMap[entry[0]]=this.sort(entry[1]));
        return this;
    }

    //. 排序
    sort(rules){
        rules=Array.from(new Set(rules));
        if(rules.length<2)return rules;
        let list=rules.map((r,idx)=>({idx,r}));
        return list
            .sort((a,b)=>{
                if(a.r.config.mode==='normal')return 1;
                if(b.r.config.mode==='normal')return -1;
                let ac=this.config(a.r);
                let bc=this.config(b.r);
                let ai=ac.penetrate?-1*a.r.generation:a.r.generation;
                let bi=bc.penetrate?-1*b.r.generation:b.r.generation;
                if(ai!==bi)return ai-bi;
                if(ac.order!==bc.order)return ac.order-bc.order;
                return a.idx-b.idx;
            })
            .map(x=>x.r);
    }

    //. 生效的第一规则
    cur(key){
        let rules=this.get(key);
        if(rules){
            let colors=rules.filter(r=>{
                if(r.config.mode==='mapping'){
                    return !r.inherit;
                }
                return r.config.mode!=='normal';
            });
            return colors.length>0?colors[0]:rules[0];
        }
    }


    //. 获取分组
    get(key=this.mainKey,defaults){
        if(this.ruleMap[key]){
            return this.ruleMap[key];
        }
        return defaults;
    }

    //.插入
    append(rules,key=this.mainKey,unshift=false){       //, rules：规则，key：组名，unshift=true头部插入
        let list;
        let source=this.get(key);
        if(rules instanceof Array){
            list=rules;
        }else if(rules instanceof RuleBundle){
            list=rules.get(key);
            if(!list)return this;
        }else{
            list=[rules];
        }
        if(!source)source=this.ruleMap[key]=[];
        //` 过滤值相同的
        list=list.filter(r=>{
            return !source.some(x=>x.config===r.config&&x.nodes.source===r.nodes.source&&x.nodes.target===r.nodes.target);
        });

        //`
        if(unshift){
            source.unshift(...list);
        }else{
            source.push(...list);
        }
        return this;
    }

    //' 含有穿透规则
    containPenetrate(key){
        return this.get(key,[]).some(r=>this.config(r).penetrate);
    }
    //' 获取配置
    config(ruleItem){
        return RULE_CONFIGS[ruleItem.config.mode];
    }
}

//% 匹配规则项
class RuleItem{
    constructor(config,nodes,inherit=false,generation=0) {
        this.config=config;                 //, 规则
        this.nodes=nodes;                  //, 节点集合【NodeBundle】
        this.inherit=inherit;                 //, 是否继承
        this.generation=generation;    //, 继承代数
    }

    //. 创建匹配规则
    instanceCheck(source,match){
        return new RuleItem(this.config, new NodeBundle(source,null,match));
    }

    //. 创建继承规则
    instanceInherit(source){
        return new RuleItem(this.config,new NodeBundle(source,null,this.nodes.match,this.nodes.root),true,this.generation+1);
    }

    //. 创建继承规则
    static instanceNormal(source){
        return new RuleItem(RULE_NORMAL,new NodeBundle(source),false);      //, normal作为所有节点的公有规则
    }

    //. 规则测试
    test(base,target){
        return this.config.test(base,target);
    }

    //' 构建规则对象
    from(r){
        this.config=new Rule(
            r.base,
            r.mode,
            {relative:r.relative,type:r.type,testOnlyRelative:r.testOnlyRelative},
            {target:r.target,pruning:r.pruning,zip:r.zip,sub:r.sub,dispatch:r.dispatch},
            r.through
        );
        return this;
    }
}

//% 规则相关节点集合
class NodeBundle{
    constructor(source,target,match,root,merge) {
        this.source=source;   //, 源节点
        this.target=target;     //, 目标节点，映射时与source不同
        this.match=match;    //, 匹配的节点（保留）
        this.root=root;          //, 树根节点（保留）
        this.merge=merge;   //, 合并前节点（保留）
    }
}

//% 规则实例化配置
class Rule{
    static TYPE_MATCH=1;            //匹配模式：字符串全匹配
    static TYPE_REGEX=2;              //匹配模式：正则
    static DISPATCH_TARGET=1;    //匹配来源：对映射目标匹配
    static DISPATCH_BASE=2;        //匹配来源：源节点匹配（对多个映射目标同时生效）

    constructor(base, mode,
                {relative, type,testOnlyRelative}={},
                {target, pruning, zip, sub, dispatch}={},
                through) {
        this.base=base;                                                                                             //, 基础路径
        this.mode=mode;                                                                                         //, 规则类型
        this.relative=relative;                                                                                     //, 相对路径
        this.type=type==='regex'?Rule.TYPE_REGEX:Rule.TYPE_MATCH;                   //, 相对路径匹配方式
        this.testOnlyRelative=testOnlyRelative;                                                          //, regex匹配的true:相对路径 false:全路径
        this.target=target;                                                                                        //, 映射路径（mode=mapping生效）
        this.pruning=pruning||false;                                                                          //, 是否剪枝（仅映射mode=mapping有效），true则原树结构去除，false则复制出新的结构
        this.zip=zip||false;                                                                                         //, 是否映射为zip
        this.sub=sub||false;                                                                                       //, 是否映射为子节点，zip=true时sub必须为true
        this.dispatch=dispatch||Rule.DISPATCH_BASE;                                               //, 规则分发类型，DISPATCH_TARGET则仅在目标路径生效，DISPATCH_BASE则在映射（mode=mapping）时源树结构匹配所有映射树结构都生效
        this.through=through||false;                                                                         //, 是否穿透zip，对zip内文件生效
    }

    //. 测试规则
    test(node){
        if(!node.path.startsWith(this.base)){
            return false;
        }
        if(this.type===Rule.TYPE_REGEX&&(!new RegExp(this.relative).test((this.testOnlyRelative?node.path.replace(this.base,''):node.path)))){
            return false;
        }
        if(this.type===Rule.TYPE_MATCH&&this.format(this.base,this.relative||'')!==node.path) {
            return false;
        }
        if(!this.through&&node.inZip) {
            return false;
        }
        return true;
    }

    //' 映射地址
    mapping(name){
        return this.format(this.sub?`${this.target}/${name}`:`${this.target}`);
    }
    //' 分发节点
    dispatchNode(source,target){
        return this.dispatch===Rule.DISPATCH_TARGET&&target?target:source;
    }
    //' 格式化路径
    format(...path){
        return path.join('/').replaceAll(/\/+/gm, '/').replaceAll(/\/$/gm,'');
    }
}


class Handler{
    constructor(children,after) {
        if(children)this.children=children;
        if(after)this.after=after;
    }


    children=(pb)=>pb.children;
    after=(base,leaf,forest,source, {maps, checks},key)=>true;

}

//. 合并森林
function mergeTree(baseTreeNode,                                                                            //, baseTreeNode：基础树
    comparedTree,                                                                                   //, comparedTree：待合并树
    targetKey,                                                                                           //, targetKey：待合并节点合并后规则组名
    mergeKey){                                                                                         //, mergeKey：待合并节点合并前规则组名
    if(!comparedTree.children)return;
    for(let compared of comparedTree.children){
        let baseNode=baseTreeNode.find(compared.name);
        let child;
        if(baseNode){
            child=baseNode.merge(baseNode,compared,targetKey,mergeKey);
        }else{
            let node=new Node().from(compared);
            if(baseTreeNode.type===4||baseTreeNode.inZip)node.inZip=true;
            child=node.merge(node,compared,targetKey,mergeKey);
            baseTreeNode.addNode(child)
        }
        mergeTree(child,compared,targetKey,mergeKey);
    }
    baseTreeNode.children.sort((a,b)=>a.type===b.type?
        a.name.localeCompare(b.name):a.type-b.type);
}

//. 初始化树结构+规则
async function trees(pb,                                                                                                       //, 父基础节点{}
    pns=[],                                                                                                     //, 父节点映射的集合 【Node】
    forest=new Node(),                                                                                  //, 映射的所有树
    parent = new Node(),                                                                               //, 父节点【Node】
    {maps=new RuleBundle(),checks=new RuleBundle()},                                //, maps：映射规则，checks：普通规则
    key,                                                                                                           //, 分组名
   handler=new Handler()                                                                      //,解析器
){
    let children=await handler.children(pb,{maps,checks});
    for(let base of children){
        let source=parent.addNode(new Node().from(base));
        let sourceRules=checks.check(source,source,key,Rule.DISPATCH_BASE);      //,普通规则（base）
        let mappingRules=maps.check(source,null,key,Rule.DISPATCH_BASE);         //,映射规则（base）【临时】
        let sourceInheritRules=parent.rules.inherits(source,key,Rule.DISPATCH_BASE);                 //,继承规则（base）

        let curNodes=[];                                                                                                                                                         //, 源节点映射节点
        let pruning=false;                                                                                                                                                       //, 是否剪枝
        let penetrate=sourceInheritRules.containPenetrate(key)||sourceRules.containPenetrate(key);                      //, 当前规则或继承规则不含有穿透（覆盖），则映射
        if(!penetrate) {
            let ms=mappingRules.get(key,[]);
            for (let i = 0; i < ms.length; ++i) {
                let mapping = ms[i];
                let {config} = mapping;
                let {leaf, root} = treeByPath(config.mapping(base.name), base.type, config.zip);
                let mapRule = mapping.instanceCheck(source);

                leaf.rules = checks                                                                                                                                                   //`匹配映射节点（target）不继承源节点规则
                    .check(leaf, source, key, Rule.DISPATCH_TARGET)                                 //,映射节点（target）- 普通规则（target）
                    .append(sourceRules, key, false)                                                                                          //,映射节点（target）- 普通规则（base）
                    .append(mapRule, key, false)                                                                                               //,映射节点（target）- 映射规则（target）
                    .normal(source, key)                                                                                                                      //, 映射节点（target）- 基础规则（target）
                    .sorts();
                source.rules.append(mapRule, key, false);
                //,源节点（base）- 映射规则（target）
                forest.addNode(root);
                curNodes.push({node: leaf, root, rule: mapRule});
                pruning = (i === 0 ? true : pruning)&&config.pruning;
            }
        }

        source.rules
            .append(sourceRules,key,false)                                                                                                                                //,源节点（base）- 普通规则（base）
            .append(sourceInheritRules,key,false)                                                                                                                      //,源节点（base）- 继承规则（base）
            .normal(source,key)                                                                                                                                                 //,源节点（base）-  基础规则（base）
            //.append(normal,key,false)
            .sorts();

        let leaf;
        if(pruning){
            leaf=curNodes;
        }else{
            let extendCurNodes=[];
            for(let pn of pns){
                let node=new Node().from(base);
                node.inZip=pn.node.type===FILE_TYPE.ZIP||pn.node.inZip;
                node.path=pn.node.path?`${pn.node.path}/${node.name}`:node.name;
                let target=pn.node.addNode(node);
                target.rules=checks
                    .check(target, source,key,Rule.DISPATCH_TARGET)                              //,扩展节点（pn）- 普通规则（pn）
                    .append(sourceRules,key)                                                                                                                //,扩展节点（pn）- 普通规则（base）
                    .normal(source, key)                                                                                                                     //,扩展节点（pn）- 基础规则（pn）
                    .append(pn.node.rules.inherits(source,key),key,false)                                                          //,扩展节点（pn）- 继承规则（pn）
                    //.append(sourceInheritRules,key,false)                                                                                                               //,扩展节点（pn）- 继承规则（base）

                    //.setMappingNodes(source,key)
                    //.append(normal,key,false)
                    .sorts();
                extendCurNodes.push({node:target,root:pn.root});
            }
            leaf=curNodes.concat(extendCurNodes);
        }
        source.pns=leaf;                                                                                       //, 保存过程映射树节点
        //if(!base.children)continue;
        if(!handler.after(base,leaf,forest,source, {maps, checks},key))continue;
        if(!handler.children(base))continue;
        await trees(base, leaf, forest, source, {maps, checks},key,handler);
    }
}

//. 根据路径构建树
function treeByPath(path,leafType,zip=false){                                                             //, path:路径，leafType:路径结尾文件类型，zip：父节点是否zip
    let root;
    let parent=null,leaf=null;
    let start=0,end=0;
    path=path+'/';

    while((end=path.indexOf('/',start))>0){
        if(parent){
            parent.addNode(leaf);
            parent=leaf;
        }
        leaf=new Node(path.substring(start,end),path.substring(0,end),1);
        if(!root)root=leaf;
        if(!parent)parent=new Node();
        start=end+1;
    }
    if(parent){
        parent.addNode(leaf);
    }
    leaf.type=leafType;
    if(zip){
        parent.type=FILE_TYPE.ZIP;
        leaf.inZip=true;
    }
    return {root,leaf,parent};
}

//. 初始化基础规则
function initBaseRule(rule,key){
    return {
        maps:new RuleBundle(rule.filter(r=>r.mode==='mapping').map(r=>new RuleItem().from(r)),key),
        checks:new RuleBundle(rule.filter(r=>r.mode!=='mapping'&&r.mode!=='remove').map(r=>new RuleItem().from(r)),key)
    };
}
//. 初始化比较规则
function initComparedRule(rule,key){
    return {
        maps:new RuleBundle(),
        checks:new RuleBundle(rule.filter(r=>r.mode==='remove').map(r=>new RuleItem().from(r)),key)
    };
}


export {
    Node,
    NodeBundle,
    RuleBundle,
    RuleItem,
    Rule,
    Handler,

    trees,
    treeByPath,
    mergeTree,
    initBaseRule,
    initComparedRule,
    RULE_CONFIGS
}