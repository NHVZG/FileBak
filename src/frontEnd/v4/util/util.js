//. 时间
function time(){
    let date=new Date();
    return date.toLocaleDateString().replaceAll('/','-')+' '+ date.toTimeString().split(' ')[0];
}

export {time}