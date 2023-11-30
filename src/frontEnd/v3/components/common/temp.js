function buildTree(node,path,pNode){
    let arr=[];
    pNode=pNode||{};
    if(typeof node==='string'){
        let type=node.endsWith('.zip')?4:2;
        return {type,leaf:true,label:node,display:true,name:node,path:`${path?path+'/':''}${node}`,inZip:pNode.type===4||pNode.inZip};
    }else if(node instanceof Array){
        node.inZip=pNode.inZip;
        for(let item of node){
            let i=buildTree(item,path,node);
            if(i instanceof Array){
                for(let k of i){
                    arr.push(k);
                }
            }else{
                arr.push(i);
            }
        }
    }else if(node instanceof Object){
        for(let entry of Object.entries(node)){
            let name=entry[0];
            let item=entry[1];
            if(typeof item==='string'){
                let type=name.endsWith('.zip')?4:2;
                let node={type,leaf:true,label:name,display:true,name,path:`${path?path+'/':''}${name}`,inZip:pNode.type===4||pNode.inZip};
                arr.push(node);
            }else if(item instanceof Object){
                let type=name.endsWith('.zip')?4:1;
                let subPath=`${path?path+'/':''}${name}`;
                let node={type,leaf:false,label:name,display:true,name,path:subPath,inZip:pNode.type===4||pNode.inZip}
                let children=buildTree(item,subPath,node);
                node.children=children;
                arr.push(node);
            }
        }
    }
    arr.sort((a,b)=>a.name.localeCompare(b.name));
    return arr;
}

function randomNode(folder=false,suffix,count,start=0){
    let arr=[];
    for(let i=start;i<start+count;i++){
        arr.push(folder?{[(i+1)+suffix]:[]}:(i+1)+suffix);
    }
    return arr;
}


function buildTestStruct(key,{leafStart=0,groupCount=2,groupStart=1}={}){
    let data={
        [key]:[
            ...randomNode(false,`#${key}@0`,2,2+leafStart),
        ]
    };
    for(let i=groupStart;i<groupStart+groupCount;++i){
        data[key].push({
            [`#${key}@${i}`]:[
                ...randomNode(false,`#${key}@1`,2,4+leafStart),
                {[`#${key}@11`]:[...randomNode(false,`#${key}@11`,2,6+leafStart)]}
            ]
        });
    }
    return data;
}


/*let leftTrees={
    //B:{B1:'B1'}
    A:[
        ...randomNode(false,'.jpg',2),
        {a1:[
                ...randomNode(true,'f',1),
                {a:[
                        ...randomNode(false,'.png',1),
                        {aa:[
                                {aaa:[
                                        {increment:[
                                                'increment.jpeg'
                                            ]},
                                        ...randomNode(false,'.increment.jpeg',2),
                                    ]},
                                ...randomNode(false,'.increment.jpeg',2,2),
                            ]}
                    ]},
                ...randomNode(false,'.increment.jpeg',2,4),
            ]}
    ],
    B:{
        b:{
            bb:['cover.mp4']
        }
    },
    cover:[{
        co:[
            'cover.mp3'
        ]
    }],
    updated:[
        ...randomNode(false,'.java',2),
        {u:['u.java']},
        {increment:[...randomNode(false,'increment.jpeg',2,6)]},
        ...randomNode(false,'.java',2,2),
    ],
    incrementCover: {
        c:[
            {except:[
                    ...randomNode(false,'except.c',2)
                ]},
            ...randomNode(false,'incrementCover.c',3,2)
        ]
    },
    D:{
        d:[...randomNode(false,'remove.txt',3)]
    },
    E:[
        [...randomNode(false,'random.exe',2)],
        {e:{
            'except.zip':'',
             cover:[...randomNode(false,'cover.zip',2)],
             update:[...randomNode(false,'update.zip',2)],
             incrementCover:[...randomNode(false,'incrementCover.zip',2)],
             increment:[...randomNode(false,'increment.zip',2)]
        }},
        [...randomNode(false,'random.exe',2,2)],
        {
            E2:[...randomNode(false,'random.exe',2,2)]
        }
    ],
    E1:[
        [...randomNode(false,'random.exe',2)],
        [...randomNode(false,'random.exe',2,4)],
        {
            E11:{
                E12:'E12'
            }
        }
    ],
    H:[
        {h:'h'},
        {h3:{h:'h'}}
    ],
    J:[
        ...randomNode(false,'z.z',3),
        ...randomNode(false,'z.txt',3),
        {
            'a.zip':{
                a:{
                    a1:'a1'
                }
            },
            'c':[...randomNode(false,'c.txt',3)]
        }
    ]
};

let rightTrees={
    //B:{B1:'B1'}

    A:[
        ...randomNode(false,'.jpg',1),
        {a1:[
                ...randomNode(true,'f',1),
                {a:[
                        ...randomNode(false,'.png',1),
                        {aa:[
                                {aaa:[
                                        {increment:[
                                                'increment.jpeg'
                                            ]},
                                        ...randomNode(false,'.increment.jpeg',2,1),
                                    ]},
                                ...randomNode(false,'.increment.jpeg',2,2),
                            ]}
                    ]},
                ...randomNode(false,'.increment.jpeg',2,4),
            ]}
    ],
    B:{
        b:{
            bb:['cover.mp4']
        }
    },
    cover:[{
        co:[
            'cover.mp3',
            {cc:['cover1.mp3']}
        ],
        'cover.wma':'',
        'cover.rmvb':''
    }],
    updated:[
        ...randomNode(false,'.java',2),
        {u:['u.java']},
        {increment:[...randomNode(false,'increment.jpeg',2,6)]},
        ...randomNode(false,'.java',2,2),
    ],
    incrementCover: {
        c:[
            {except:[
                    ...randomNode(false,'except.c',2)
                ]},
            ...randomNode(false,'incrementCover.c',2,2)
        ]
    },
    D:{
        d:[...randomNode(false,'remove.txt',4)],
        remove:{
            'removeabc.md':'removeabc.md'
        }
    },
    E:[
        [...randomNode(false,'random.exe',2)],
        {e:{
                'except.zip':'',
                cover:[...randomNode(false,'cover.zip',3)],
                update:[...randomNode(false,'update.zip',3)],
                incrementCover:[...randomNode(false,'incrementCover.zip',2,1)],
                increment:[...randomNode(false,'increment.zip',1)]
            }},
        [...randomNode(false,'random.exe',2,2)]
    ],
    E2:'E2',
    H:[
        {h:'h'},
        {h2:{h:'h'}}
    ],
    J: {
        'b.zip':{
            a:{
                a2:'a2'
            }
        }
    }
};*/
let leftTrees= {
    a:{
      'a':randomNode(false,'@a',1),
      'a.zip':{
          az:randomNode(false,'@az',2),
          bz:randomNode(false,'@az',2),
      },
        "b.zip":{
            az:randomNode(false,'@bz',2),
            bz:randomNode(false,'@bz',2),
        }
    },

    ...buildTestStruct('none',{leafStart:3,groupCount:2,groupStart:2}),
    base: {
        ...buildTestStruct('increment'),
        ...buildTestStruct('update'),
        ...buildTestStruct('incrementUpdate'),
        ...buildTestStruct('cover',{groupCount:1,groupStart:3}),
        ...buildTestStruct('except'),
        ...buildTestStruct('remove',{groupCount:1}),
        ...buildTestStruct('mapping',{groupCount:3}),
    },
    mix:{
        cover:{
            increment: [
                ...randomNode(false,'@increment',2),
                {
                    incrementUpdate:randomNode(false,'@incrementUpdate',2)
                }
            ],
            except:[
                randomNode(false,'@except',2),
                {mapping:randomNode(false,'@mapping',2)},
                {increment:randomNode(false,'@increment',2)},
            ],
            update:randomNode(false,'@update',2),
            x1:randomNode(false,'@cover',2),
            mapping:{
                m1:randomNode(false,'@mapping',2),
                m2:randomNode(false,'@mapping',2),
                "a.zip":{
                    a:randomNode(false,'@z',2),
                    b:randomNode(false,'@z',2)
                }
            }
        }
    }
};

let rightTrees={
    a:{
        'a.zip':{
            az:randomNode(false,'@az',2,1),
            bz:randomNode(false,'@az',2,1),
        }
    },
    ...buildTestStruct('none', {groupCount:1}),
    base: {
        ...buildTestStruct('increment',{leafStart:1,groupCount:1}),
        ...buildTestStruct('update',{leafStart:1,groupCount:1}),
        ...buildTestStruct('incrementUpdate',{leafStart:1,groupCount:1}),

        //...buildTestStruct('cover',{leafStart:3,groupCount:1,groupStart:3}),
        cover:{
            '#cover@3':{
                '#cover@112':'#cover@112',
                '#cover@111':'#cover@111',
                '#cover@11':[{
                    asd:['123','456']
                }]
            },
            '#cover@2':['#cover@222','#cover@211'],
        },

        ...buildTestStruct('except',{groupCount:1}),
        ...buildTestStruct('remove'),
        ...buildTestStruct('mapping',{groupCount:1}),
    },
    mix:{
        cover:{

            increment: [
                ...randomNode(false,'@increment',2,1),
                {
                    incrementUpdate:randomNode(false,'@incrementUpdate',2,1)
                }
            ],
            except:randomNode(false,'@except',2,1),
            update:randomNode(false,'@update',2),
            x1:randomNode(false,'@cover',2,1),
            mapping:{
                m1:randomNode(false,'@mapping',2),
                "a.zip":{
                    a:randomNode(false,'@z',2,1),
                    b:randomNode(false,'@z',2),
                    c:randomNode(false,'@z',2)
                }
            }
        }
    }
};


export {
    leftTrees,
    rightTrees,
    buildTree,
    randomNode
}