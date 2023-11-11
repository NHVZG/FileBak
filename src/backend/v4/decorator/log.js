const BEFORE='before';
const AFTER='after';

//. 注解@打印日志
function log(param,aspect=BEFORE,defaults={},logName=true){
    let generator=typeof param==='function'?param:()=>param;

    return (target,name,descriptor)=>{
        let func = descriptor.value;
        descriptor.value = function (...args) {
            if(aspect===BEFORE){
                let txt=compile(generator(...args),func,args,this,null,defaults,logName);
                if(txt)console.log(txt);
            }
            let result;
            try{
                result=func.apply(this,args);
            }catch (err){
                console.dir(err);
                return;
            }
            if(aspect===AFTER){
                let txt=compile(generator(result,...args),func,args,this,result,defaults,logName);
                if(txt)console.log(txt);
            }
            return result;
        };
    };
}

log.AFTER=AFTER;
log.BEFORE=BEFORE;

//. 编译字符串
//, str：解析的字符串，func：切点，args：参数值，target：func所属对象，res：func返回值
function compile(str,func,args,target,res,defaults,logName){
    let argsMap=parseArgs(func,args,target);
    argsMap['__res']=res;

    let VARIABLE_SYNTAX=/\$\{([^}]+)/g;                                                          //, 匹配到非}为止   , 迭代器效果由于正则表达式的lastIndex缘故
    let matches;
    let resultStr=str;
    while (matches  = VARIABLE_SYNTAX.exec(str)) {
        let expression=matches[1];
        let propArray=expression.split('.');
        let idx=0,obj=argsMap;
        while(propArray.length>idx){
            obj=obj[propArray[idx]];
            if(!obj)break;
            idx++;
        }
        if(obj) {
            resultStr = resultStr.replaceAll(matches[0] + '}', obj);
        }else if(defaults[matches[1]]){
            resultStr = resultStr.replaceAll(matches[0] + '}', defaults[matches[1]]);
        }
    }
    if(resultStr&&logName){
        resultStr=(target.name?`【${target.name}】`:'')+resultStr;
    }
    return resultStr;
}

//. 设置函数键值对
function parseArgs(func,args,target){
    let argsKeys=$args(func);
    let argMap={'this':target};
    let obj=null;
    let argsIdx=0;
    argsKeys.map((key,idx)=>{
        //解构参数
        if(key.startsWith('{')){
            obj=args[argsIdx];
            argMap[key]=obj[key];
        }else if(key.endsWith('}')){
            argMap[key]=obj[key];
            obj=null;
            ++argsIdx;
        }else if(obj!=null){
            argMap[key]=obj[key];
        }else{
            argMap[key]=args[argsIdx++];
        }
    });
    return argMap;
}

//. 解析函数参数列表，function a(a,b,c,d={k=2}={},{qq,aa,lk}){} 输出：['a', 'b', 'c', 'd', '{qq', 'aa', 'lk}']
//, https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
function $args(func) {
    return (func + '')
        .replace(/[/][/].*$/mg,'') // strip single-line comments
        .replace(/\s+/g, '') // strip white space
        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
        .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
        .replace(/=[^,]+/g, '') // strip any ES6 defaults
        .split(',').filter(Boolean); // split & filter [""]
}

export {log}