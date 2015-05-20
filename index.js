var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response){
    response.sendFile('index.html', { root: __dirname });
});

app.listen(!!process.env && !!process.env.PORT ? process.env.PORT : 8080);