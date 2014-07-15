var ssh2 = require('ssh2');
var conn = new ssh2();
var fs = require('fs');


conn.on('connect', function(){
                            console.log( "- connected" );
                        });

conn.on('end', function(){
    console.log("closing sftp connection");
    callback();
});

conn.connect({
        "host": "partnerupload.google.com",
        "port": 19321,
        "username": "yt-indmusic",
        privateKey: fs.readFileSync("/home/agreen/.ssh/id_rsa")
})



conn.on('ready', function(){
    console.log("- ready");

    conn.sftp(function(err,sftp){
        if(err){console.log(err)}

        console.log("- SFTP started");


        //var readStream = fs.createReadStream(element.title);
        var fileName = 'CREATORDISTRACTOR'
        var xmlReadStream = fs.createReadStream(fileName+'.xml');

        //var writeStream = sftp.createWriteStream("/INDMUSIC/"+element.title);

        var xmlWriteStream = sftp.createWriteStream("/INDMUSIC/CREATORANDDISTRACTOR.xml");

        /*writeStream.on('close', function(){
            console.log("transfered - "+element.title);
            sftp.end();
            //THIS COUNTER IS TO CLOSE THE CONNECTION ONCE THE FILES ARE DONE UPLOADING 
            wham++;

            if(wham == ids.length){

                conn.end();
                //*****ADD CODE TO UPDATE DESCRIPTION ON GOOGLE DRIVE FOLDER
            }
        })*/

        //ANOTHER XML WRITESTREAM
        xmlWriteStream.on('close', function(){
            console.log("transfered - CREATORADDISTRACTOR");
            sftp.end();
        })
        //readStream.pipe(writeStream);
        xmlReadStream.pipe(xmlWriteStream);
    })
})