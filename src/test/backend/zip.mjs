import JSZip from "jszip";
import fs from "fs";

var zip=new JSZip();

fs.readFile("D:/Screenshot_20230201214717.jpg", function (err, data) {
    var zip = new JSZip();

    zip.loadAsync(data).then(function(zip){
        console.log(zip);
    })
});

//D:/Home/Downloads/SQLEncryptDecrypt.zip   bin
fs.readFile("D:/Home/Downloads/test/a.zip", function (err, data) {
    if (err) throw err;
    var zip = new JSZip();
    zip.loadAsync(data)
        .then(function (zip) {
            console.log(zip.files);
            // src/file.txt
            // example.txt
            //console.log(zip.files["example.txt"].unsafeOriginalName);
            // "../../example.txt"
            zip.folder("a").forEach(function (relativePath, file){
                if(file.name==='a/b.zip'){
                    new JSZip().loadAsync(file._data.compressedContent).then(function(zip1){
                        console.log(zip1);
                    });
                }

                console.log("iterating over", relativePath);
            });
        });
});

