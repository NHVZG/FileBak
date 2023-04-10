

function testable(target) {
    target.prototype.isTestable = 123;
}

function aop(arg){
    console.log(arg);
    return (target,name,descriptor)=> {
        let originalValue = descriptor.value;
        descriptor.value = function (...args) {
            console.log('before');
            let result = originalValue.apply(this, args);
            console.log('after');
            return result;
        }
    }
}

@testable
class MyTestableClass {

    @aop(555)
    test(){
       console.log('test');
    }

}


export {MyTestableClass}