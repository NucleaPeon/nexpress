var querystring = require('querystring');
var fs = require('fs');
var mime = require('mime-types');
var path = require('path');
var func = require('function.create');

(function() {

    var post = function() {

        /** Simple route table
            * {"hosted address for page": "file contents to host"}
            */
        var routes = {};

        this.route = function(address, target) {
            routes[address] = target;
        };

        this.getRoutes = function() {
            return routes;
        }

        this.error = function(code, message) {
            res.writeHead(code, {"Content-Type": "application/json"});
            res.end(JSON.stringify({"error": code, "message": message}));
        }

        this.page = function(page) {

            return Function.create(null, function(req, res) {
                res.writeHead(200, {"Content-Type": "text/html"});
                fs.readFile(page, function(err, data) {
                    if (err) throw err;
                    res.write(data);
                    res.end();
                });

            });
        }

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
                console.log("Params: " + form);

                if (routes[req.url] !== undefined) {
                    routes[req.url](req, res);
                }
                else {
                    this.error(404, "Request to " + req.url + " not found");
                }
            });
        }

        return this;
    }

    module.exports = post;

})();