

const schema = {
    type: 'object',
    properties: {
        test: {
            type: 'string',
        },
    },
};

//. 自定义loader解析js
//, https://webpack.docschina.org/loaders/imports-loader/
function compile(source) {

    //this.resourcePath
    //console.log('The request path', source);

    // 扫描注解 自动import

    return source;//+'\nconsole.log("asdasjdas")';//`export default ${JSON.stringify(source)}`;
}

module.exports=compile;