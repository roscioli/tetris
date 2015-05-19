var http = require("http");
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response){
    response.sendFile('index.html', { root: __dirname });
});

http.listen(process.env.PORT || 8080, function(){
  console.log('listening on ', http.address().port);
});