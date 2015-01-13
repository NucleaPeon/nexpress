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
      console.log("Favicon");
      serveStatic(res, cache, options.favicon, options);
    } else if (requestInRoute(req.url, req.method, options)) {
      
      if (req.method == "POST") {
        console.log("Post Compilation");
        compilePost(req, res, cache, options);
      }
      console.log("Request in Route");
      serveStatic(res, cache, serveFile, options);
    } else if (serveFile === undefined) {
      // Not a planned route
      console.log("Unplanned route " + serveFile);
      serveStatic(res, cache, req.url, options);
    } else {
      console.log("serve known route");
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
      console.log("Respond with page " + options.routes[request.method][request.url]);
      serveStatic(response, cache, options.routes[request.method][request.url],
                  options);
    }
    else {
      console.log("Using User-Defined Post Function");
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
  console.log("Sending file " + filePath);
  response.writeHead(200, {"Content-Type": mime.lookup(path.basename(filePath))});
  response.end(fileContents)
}

function serveStatic(response, cache, absPath, options) {
  console.log("Serving " + absPath);
  if (cache.get(absPath) !== undefined) {
    console.log("IN cache");
    sendFile(response, absPath, cache.get(absPath));
  }
  else {
    console.log("Not In Cache.");
    fs.exists(absPath, function(exists) {
      console.log(absPath + " exists: " + exists);
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) {
            console.log(err);
            sendFile(response, options.codes[404], 
                     cache.get(options.codes[404]));
          } 
          else {
            console.log("Caching " + absPath);
            cache.set(absPath, data);
            sendFile(response, absPath, data);
          }
        });
      }
      else {
        console.log(absPath);
        // Determine if this is an external url
        if (absPath.substring(0, 7) == "http://" || absPath.substring(0, 4) == "www.") { 
          redirect(response, absPath);
        }
        else {
          sendFile(response, options.codes[404], 
                 cache.get(options.codes[404]));
        }
      }
    });
  }
}