var util = require('util');
var express = require('express');
var Miso = require('miso.dataset');
var csv = require('csv');
var request = require('request');


var DOC = 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=%s&single=true&gid=%s&output=csv';


var app = express();

app.set('views', __dirname + '/views')
app.set('view options', {layout: false});
app.engine('html', require('ejs').renderFile);

app.use('/static', express.static(__dirname + '/public'));


app.get('/', function(req, res){
    res.render("index.html");
});

app.get('/doc', function(req, res){
    
    var key = '';
    var sheet = '0';
    
    if(req.query['key'] !== undefined){
        key = req.query['key'];
    }else{
        return res.json(500, {error:'key is not defined'});
    }
    
    if(req.query['sheet'] !== undefined){
        sheet = req.query['sheet'];
    }
    
    if(key.length != 44){
        return res.json(500, {error:'key length is wrong'});
    }
    
    var url = util.format(DOC, key, sheet);
    
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var csvString = body;
            var parser = csv();
            var records = [];
            var errors = [];
    
            parser.on("error", function(error){
                res.json(500, {error:'fetch error'});
            });
    
            parser.on("record", function(row, index){
                records.push(row);
            });
    
            parser.on("end", function(){
                var ds = new Miso.Dataset({
                    data: records
                });
                ds.fetch({
                    error: function(error){
                        errors.push(error);
                    },
                    success: function(){
                        
                        var headers = ds.columnNames();
                        var rows = [];
                        var i = 1;
                        
                        this.each(function(row){
                            
                            row._id = i;
                            
                            rows.push(row);
                            
                            i++;
                        });
                        
                        res.json({'rows':rows, 'errors':errors});
                    }
                });
            });
    
            // Tell the parser to return rows as objects keyed by column names.
            parser.from.options({
                columns: true
            });
    
            // Start parsing. This package will not throw errors for duplicate header rows
            // or other similar issues that will stop Miso.Dataset in its tracks.
            parser.from(csvString);
    
        }else{
            res.json(500, {error:'request error'});
        }
    });
});

app.listen(3000);
console.log('Listening on port 3000');