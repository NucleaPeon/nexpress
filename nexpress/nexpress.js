exports = module.exports = nexus;
// Requires
var http = require('http');
var fs = require('fs');
var cache = require('js-cache');
var mime = require('mime-types');
var path = require('path');
var querystring = require('querystring');

function nexus(options) {
  
  // Append the dot for relative
  cacheStatic(options.static);
  
  var server =  http.createServer(function (req, res) { 
    req.socket.setTimeout(options.request.socket.timeout);
    var serveFile = options.routes[req.method][req.url];
    if (req.url == '/favicon.ico') {
      serveStatic(res, cache, options.favicon, options);
    } else if (requestInRoute(req.url, req.method, options)) {
      if (req.method == "POST") {
        compilePost(req, res, cache, options);
      }
      serveStatic(res, cache, serveFile, options);
    } else if (serveFile === undefined) {
      // Not a planned route
      serveStatic(res, cache, req.url, options);
    } else {
      // ServeFile is known and we GET it
      serveStatic(res, cache, serveFile, options);
    }
  });
  server.listen(options.port);
} 

function compilePost(request, response, cache, options, callback) {
  var fullBody = '';
  request.on('data', function(chunk) {
    fullBody += chunk.toString();
    if (fullBody.length > 1e6) {
      request.connection.destroy();
    }
  });
  request.on('end', function() {
    var form = querystring.parse(fullBody);
    request.body = form;
    if (callback === undefined) {
      // So we can detect the actual file relatively
      serveStatic(response, cache, options.routes[request.method][request.url],
                  options);
    }
    else {
      callback(response, form, prepend, append);
    }
  });
  
}

function redirect(response, url) {
  var body = 'Redirecting to ' + url;
  response.writeHead(302, {
    'Content-Type': 'text/plain',
    'Location': url,
    'Content-Length': body.length
  });
  response.end(body);
}

function requestInRoute(route, request, options) {
  var keys = Object.keys(options.routes[request]);
  for(var i = 0; i < keys.length; i++) {
    if(keys[i] == route) 
      return true;
  } return false;
}

/** Cache all static directories that are submitted into the nexus:
 * Every non-hidden file (starting with a ".") is cached.
 * 
 * 
 */
function cacheStatic(dirs) {
  for(var i = 0; i < dirs.length; i++) {
    files = fs.readdirSync(dirs[i]);
    for(var j = 0; j < files.length; j++) {
      if (files[j][0] != ".") {
        cache.set(dirs[i].substring(1, dirs[i].length) + files[j], fs.readFileSync(dirs[i] + files[j]));
      }
    }
  }
}

function sendFile(response, filePath, fileContents) {
  response.writeHead(200, {"Content-Type": mime.lookup(path.basename(filePath))});
  response.end(fileContents)
}

function serveStatic(response, cache, absPath, options) {
  if (cache.get(absPath) !== undefined) {
    sendFile(response, absPath, cache.get(absPath));
  }
  else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) {
            //FIXME: Take error code out of err and use it for option codes.
            console.log(err);
            serveStatic(response, cache, options.codes[404], 
                     options);
          } 
          else {
            cache.set(absPath, data);
            sendFile(response, absPath, data);
          }
        });
      }
      else {
        // Determine if this is an external url
        if (absPath.substring(0, 7) == "http://" || absPath.substring(0, 4) == "www.") { 
          redirect(response, absPath);
        }
        else {
          // Not found
          serveStatic(response, cache, options.codes[404], 
                     options);
        }
      }
    });
  }
}