require('dotenv').load();
var imageSearch = require('node-google-image-search');
var express = require('express');
var url = require('url');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var urldb = process.env.MONGOLAB_URI;
var app = express();
app.set('port', (process.env.PORT || 8080));
app.use('/',express.static('info'));

app.get('/imagesearch/*',function(req,res){
    var newurl = url.parse(req.url,true);
    var searchterm = newurl.pathname.slice(13);
    var results = imageSearch(searchterm, rescallback, newurl.query.offset, 10);
 
    function dbupdate(sterm){
        MongoClient.connect(urldb, function (err, db) {
            if (err) {
                console.log('Unable to connect to the mongoDB server. Error:', err);
            } else {
                console.log('Connection established to db');
                var d = new Date();
                var myobject = {search_term: sterm, when: d.toUTCString()};
                db.collection('latestsearch').insert(myobject,function(err,data){if(err){throw err;} db.close();});
            }
        });
    }
    
    function rescallback(results) {
        dbupdate(searchterm);
        var imglist=[];
        for(var i=0;i<results.length;i++){
            imglist.push({"image_url": results[i].link, "snippet": results[i].snippet, "context_link": results[i].image.contextLink});
        }
        res.send(imglist);
        res.end();
    }
    
});

app.get('/recentsearch',function(req,res){
    MongoClient.connect(urldb, function (err, db) {
            if (err) {
                console.log('Unable to connect to the mongoDB server. Error:', err);
            } else {
                console.log('Connection established to db');
                db.collection('latestsearch').find().sort({when:-1}).limit(10).toArray(function(err,docs){if(err) throw err;
                var sitems = [];
                for(var i=0;i<docs.length;i++){
                    sitems.push({"search_term": docs[i].search_term, "when": docs[i].when});
                }
                    res.send(sitems);
                    res.end();
                    db.close();
                });
            }
        });
}); 
app.listen(app.get('port'));