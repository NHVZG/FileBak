import path from "path";

function __res(){
    let res={};
    let struct= {
        success:msg=>{res.success=success;return struct},
        code:code=>{res.code=code;return struct},
        data:data=>{res.data=data;return struct},
        msg:msg=>{res.msg=msg;return struct},
        result:(success)=>{
            return success?
                (data,msg)=>{
                    res={code:1,msg:msg||'success',data,success};
                    return struct;
                }:
                (msg,code,data)=>{
                    res={code:code===undefined?-1:code,msg:msg||'fail',data,success};
                    return struct;
                };
        },
        get:()=>res
    };

    return struct;
}


function __flat(...func){
    return (...arg)=>{
        let res;
        for(let f of func){
            if(!f)continue;
            res=f(...arg);
        }
        return res;
    }
}

function __time(){
    let date=new Date();
    return date.toLocaleDateString().replaceAll('/','-')+' '+ date.toTimeString().split(' ')[0];
}

//` 数据构建

function __wsmsg(){
    let o=(type,data,from,to)=>({type,data,from,to,time:__time()});
    return  {
        signed:clientID=>o('signed',{clientID},'server',clientID),
        message:(message,from,to)=>o('message',{message},from,to),
        data:o
    }
}


//` 构建路径
function __resolvePublic(relative){
    return path.resolve(__static,relative);
}

export {
    __wsmsg,
    __time,
    __flat,
    __res,
    __resolvePublic
}