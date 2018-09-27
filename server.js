var http = require('http');
var url = require('url');
var mime = require('mime');
const fs = require('fs');
//var querystring = require('querystring');

function start(route, handle) {
   function onRequest(request, response) {
      var pathname = url.parse(request.url).pathname;

      console.log('Request for ' + pathname + ' received.');

      // if (pathname === '/game') {
      // 	var postData = '';
      //    request.on('data', function(data) {
      //       postData += data;
      //    });
      //    request.on('end', function() {
      //       request.post = querystring.parse(postData);
      //       debugger;
      //    });
      //    response.writeHead(200, {'Content-Type': 'text/plain'});
      //    response.end('dada');
      // }
      fs.readFile('.' + pathname, function(err, content) {
         if (!err) {
            response.writeHead(200, {'content-type': mime.getType(pathname)});
            response.end(content);
            return;
         }
		
         response.writeHead(200, {'Content-Type': 'text/html'});
         route(handle, pathname, request, response);
 
      });

   }

   http.createServer(onRequest).listen(8888);
   console.log('Server has started.');
}

exports.start = start;
