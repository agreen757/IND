
module.exports = function(info){
    this.about = function(){

var fs = require('fs');
var csv = require('ya-csv');
var async = require('async');
var silo = [];
var holder;
var oldLocation;
//var reader = csv.createCsvFileReader('root2.csv',{columnsFromHeader:true,'separator': ','});

async.series([
    function(callback){
        first(callback);
    }/*,
    function(callback){
        second(callback);
    }*/
])

function bala(callback,location){
    var a = 0
    fs.appendFileSync(location+"/"+'xml.xml', "<?xml version=\"1.0\"?>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<feed xmlns=\"http://www.youtube.com/schemas/cms/2.0\" notification_email=\"chinua@indmusicnetwork.com\">\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<ownership tag=\"ownership\">\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<owner>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<rule percentage=\"100\">\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<condition restriction=\"exclude\" type=\"territory\"/>\n")
    fs.appendFileSync(location+"/"+'xml.xml',"</rule>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"</owner>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"</ownership>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<relationship type=\"associate\">\n")
    fs.appendFileSync(location+"/"+'xml.xml',"<item path=\"/feed/ownership[@tag='ownership']\"/>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<related_item path=\"/feed/asset\"/>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"</relationship>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<rights_admin type=\"usage match\" owner='False' tag=\"rights_admin\"/>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<rights_policy tag=\"rights_policy\">\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<rule action=\"Monetize\">\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<condition restriction=\"exclude\" type=\"territory\"/>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"</rule>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"</rights_policy>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<relationship type=\"associate\">\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<item path=\"/external/rights_policy[@name='Monetize in all countries']\"/>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<item path=\"/feed/rights_admin[@tag='rights_admin']\"/>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<related_item path=\"/feed/asset\"/>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"</relationship>\n");
    callback();
}

function first(callback){
    //push shit to silo
    console.log("first");
    info.entry.map(function(element){
        //silo.push({fileName:element.})
        console.log(element);
    });
    
    
    
    /*reader.addListener('data', function(data){
        silo.push({artist:data['Author/Artist'], trackTitle:data['Track Title'], version:data['Version'], albumTitle:data['Album Title'], composer:data['Composer'], writer:data['Writer'], publisher:data['Publisher'], producers:data['Producer(s)'], label:data['Label'], genre:data['Genre'], released:data['Releasedate'], isrc:data['ISRC'], filename:data['Filename'], ean:data['EAN'], territory:data['Territory']})
    });
    reader.addListener('end', function(){
        callback();
    })*/
}

function second(callback){
    console.log("second");
    counter = 0;
    silo.map(function(element){
        counter++;
        var wop = element.filename.split("\\");
        var location = wop[0]+"/"+wop[1];
        console.log(holder);
        if(fs.existsSync(location)){
        if(holder == undefined){
            async.series([
            function(callback){
                bala(callback,location);
            },
            function(callback){
                wala(callback,location,element,wop);
            }
        ])
        }
        else if(holder != element.albumTitle){
        fs.appendFileSync(oldLocation+"/"+'xml.xml',"</feed>\n");
        async.series([
            function(callback){
                bala(callback,location);
            },
            function(callback){
                wala(callback,location,element,wop);
            }
        ])
        }
        else{
            async.series([
                function(callback){
                    wala(callback,location,element,wop);
                }
            ])
        }
    }
    })
}

function wala(callback,location,element,wop){
    console.log("in wala");
    console.log(wop[2]);
    holder = element.albumTitle;
    oldLocation = location;
    var a = 0;
    fs.appendFileSync(location+"/"+'xml.xml',"<asset type=\"sound_recording\" tag=\""+element.isrc+"\">\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<title>"+element.trackTitle+"</title>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<custom_id>SHANACHIERECORDS</custom_id>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<artist>"+element.artist+"</artist>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<album>"+element.albumTitle+"</album>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<genre>"+element.genre+"</genre>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<label>"+element.label+"</label>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<isrc>"+element.isrc+"</isrc>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"</asset>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<file type=\"audio\" tag=\""+element.isrc+"\">\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<filename>"+wop[2]+"</filename>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"</file>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<relationship type=\"associate\">\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<item path=\"/feed/asset[@tag='"+element.isrc+"']\"/>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"<related_item path=\"/feed/file[@tag='"+element.isrc+"']\"/>\n");
    fs.appendFileSync(location+"/"+'xml.xml',"</relationship>\n");
    console.log(counter+" "+silo.length);
    setTimeout(function(){
        callback();
    }, a+=500)
}
    }}