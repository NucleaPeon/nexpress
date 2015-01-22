var querystring = require('querystring');
var fs = require('fs');
var mime = require('mime-types');
var path = require('path');

(function() {

    var post = function() {

        /** Simple route table
            * {"hosted address for page": "file contents to host"}
            */
        var routes = {};

        this.route = function(address, target) {
            routes[address] = target;
        };

        this.go = function(req, res, cb) {
            var fullBody = '';
            req.on('data', function(chunk) {
                fullBody += chunk.toString();
                if (fullBody.length > 1e6) {
                    req.connection.destroy();
                }
            });
            req.on('end', function() {
                var form = querystring.parse(fullBody);
                req.body = form;
                if(cb === undefined) {
                    console.log(req.url);
                    fs.readFile(routes[req.url], function(err, data) {
                        if (err) {
                            res.writeHead(404, {"Content-Type": "text/plain"})
                            res.end("" + err);
                            throw err;
                        }
                        else {
                            res.writeHead(200, {"Content-Type": mime.lookup(path.basename(routes[req.url]))})
                            res.end(data);
                        }
                    });
                }
                else {
                    console.log("Custom POST callback");
                    cb(req, res, form);
                }
            });
        }

        return this;
    }

    module.exports = post;

})();