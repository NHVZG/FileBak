
function log(a,aspect=BEFORE){
    let contentGenerator=(typeof a==='function')?a:()=>a;
    return (target,name,descriptor)=> {
        let originalValue = descriptor.value;
        descriptor.value = function (...args) {
            if(aspect===BEFORE){
                let txt=compileStr(target,originalValue,contentGenerator(...args),args);
                if(txt)console.log(txt);
            }

            let result
            try {
                result = originalValue.apply(this, args);
                //result = originalValue.apply(target, args);
            }catch (err){
                console.dir(err);
                return;
            }

            if(aspect===AFTER){
                let txt=compileStr(target,originalValue,contentGenerator(result,...args),args,result);
                if(txt)console.log(txt);
            }
            return result;
        }
    }
}




//% 仅支持取值，不支持其他操作
function compileStr(target,func,str,argsArr,res){
    let argNames=getParamNames(func);
    let data=argNames.reduce((obj,item,idx)=>({[item]:argsArr[idx],...obj}),{});
    data.__res=res;//结果
    data._this=target;//目标

    let VARIABLE_SYNTAX=/\$\{([^}]+)/g;     //匹配到非}为止   , 迭代器效果由于正则表达式的lastIndex缘故
    let matches;
    let result=str;
    while (matches  = VARIABLE_SYNTAX.exec(str)) {
        let expression=matches[1];
        let propArray=expression.split('.');
        propArray[0]=propArray[0]==='@'?'__res':propArray[0];//@作为返回结果的引用标志
        let idx=0,obj=null;
        while(propArray.length>idx){
            obj=(obj?obj:data)[propArray[idx]];
            idx++;
        }
        if(obj) {
            result = result.replaceAll(matches[0] + '}', obj);
        }
    }
    return result;
}



//% 获取参数列表名，不支持嵌套{a={b={c=2}={}}={}}={}
let STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
let ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
    let fnStr = func.toString().replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if(result === null)
        result = [];
    return result;
}



const BEFORE=1;
const AFTER=2;
const AROUND=3;

export {
    log,
    BEFORE,
    AFTER,
    AROUND,
}