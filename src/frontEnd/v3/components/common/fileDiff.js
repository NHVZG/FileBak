import {treeLeaf, treeMap} from "@/frontEnd/v3/components/common/util";

//.正则校验器
function buildRegexRule(list,build,onRegex=(item)=>item.value){
    build=build?build:item=>item;
    return list.map(item=>{
        let regex=new RegExp(onRegex(item));
        return {test:(val)=>regex.test(val),...build(item,regex)};
    });
}

//.相同校验器
function buildEqualRule(list,build) {
    build=build?build:item=>item;
    return list.map(item => {
        return {test: (val) => item.value === val, ...build(item)};
    });
}

function buildPath(node){
    return map=>{
        if (!map.path) map.path = {};
        treeMap(node.path, {...node}, '/', map.path, 'children', 'value');
    }
}

//updateLeaf 仅仅更新
function buildLeaf(node,key,extraData,onLeaf,updateLeaf=false){
    return map=>{
        if (!node.bsid) return;
        if (!map[key]) map[key] = {};
        if(onLeaf){
            let leaf = treeLeaf(node.bsid, '.', map[key], 'children', 'value');
            if(leaf)return onLeaf(leaf);
        }
        if(updateLeaf)return;
        let value={path:node.path,bsid:node.bsid,...extraData};
        treeMap(node.bsid, value, '.', map[key], 'children', 'value');
    }
}



function onLeaf(type){
    return leaf=>leaf.type=leaf.type>type?type:leaf.type;
}

function rulesCheck(node,rules,onMatch){
    let isMatch=false;
    for (let r of rules) {
        if (!r.test(node.path))continue;
        isMatch=true;
        onMatch&&onMatch(r,node);
    }
    return isMatch;
}



const RULE_CONF={
  custom:function(key,rules,order){
        return {
            compile(base,compared,baseParent,comparedParent) {
                let k=key;
                let match = {regex:[],exact:[]};
                let isMatch=rulesCheck(base,rules,rule=>match[rule.mode].push(rule.value));
                let updateLeaf=match.exact.length === 0 && match.regex.length === 0;
                return {
                    match: isMatch,
                    child: true,
                    parent: true,
                    build: buildLeaf(base, key, {type:1,...match}, onLeaf(1), updateLeaf),
                    buildChild: buildLeaf(base, key, {type:2,...match}, onLeaf(2), false),                                                                                           //子节点继承父节点规则，即使不匹配也要写入
                    buildParent: buildLeaf(base, key, {type:3,...match}, onLeaf(3), updateLeaf)
                };
            },
            name:key,
            order
        };
    },
  mapping:function(key,rules,order){
      return {
          compile(base,compared,baseParent,comparedParent) {
              let match = {exact: [],regex:[]};
              let isMatch=rulesCheck(base,rules,rule=>{
                  match[rule.mode].push({value:rule.value,target:rule.target,mappingToChild:rule.mappingToChild});
              });
              let updateLeaf=match.exact.length === 0 && match.regex.length === 0;
              return {
                  match: isMatch,
                  child: true,
                  parent: true,
                  build: buildLeaf(base, key, {type:1,...match}, onLeaf(1), updateLeaf),
                  buildChild: buildLeaf(base, key, {type:2,...match}, onLeaf(2), false),                                                                                           //子节点继承父节点规则，即使不匹配也要写入
                  buildParent: buildLeaf(base, key, {type:3,...match}, onLeaf(3), updateLeaf)
              };
          },
          name:key,
          order
      };
    },
    add:function(key='add'){
        return{
            compile(base,compared,pBase,pCompared){
                return {
                    match: base&&(!compared),
                    child: true,
                    parent: false,
                    build:buildLeaf(base,key,{type:1}),
                    buildChild:buildLeaf(base,key,{type:2}),
                    buildParent:buildLeaf(base,key,{type:3})
                };
            },
            name:key,
            order:0
        }
    },
    common:function (key='common'){
          return {
              compile(base,compared,pBase,pCompared){
                  return {
                      match: base&&compared,
                      child: false,
                      parent: true,
                      build:buildLeaf(base,key,{type:1}),
                      buildChild:buildLeaf(base,key,{type:2}),
                      buildParent:buildLeaf(base,key,{type:3})
                  };
              },
              name:key,
              order:1
          }
    },
    path:function(order){
        return {
            compile(base,compared,baseParent,comparedParent) {
                return {
                    match: true,
                    child: false,
                    parent: false,
                    build: buildPath(base),
                    buildChild: buildPath(base),
                    buildParent: buildPath(base)
                };
            },
            name:'path',
            order
        };
    },
};

export {
    RULE_CONF,
    onLeaf,
    buildLeaf,
    buildEqualRule,
    buildRegexRule,
    rulesCheck
}
