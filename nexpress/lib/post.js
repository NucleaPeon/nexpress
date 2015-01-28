var querystring = require('querystring');
var fs = require('fs');
var mime = require('mime-types');
var path = require('path');
var func = require('function.create');
var _request = require('request');

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

        this.respond = {
            displayJSON: function(req, res, responsedata) {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(responsedata));
            },
            error: function(req, res, e, responsedata) {
                res.writeHead(404, {"Content-Type": "text/html"});
                res.end("<b>Post encountered an error: " + e + "</b>");
            }

        }

        this.go = function(req, res, success, failure) {
            // Inserts the request and response objects where appropriate:
            //          Into the route function
            // Route object is wrapped so only the required params
            // get inserted at that time, not req/res.

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
                if (routes[req.url] !== undefined) {
                    routes[req.url](req, res, form);
                }
                else {
                    this.error(404, "Request to " + req.url + " not found");
                }
            });
        }

        /**
         * The req and res objects are submitted through the go() method into the
         * routing object.
         *
         * All POSTable objects require (req, res, data) parameters to be called.
         * Return a Function object using Function.create(null, function(req, res, data) { ... });
         * and it will get called appropriately.
         */
        this.create = function(req, res, host, port, route, method, data, success, failure) {
            var url = 'http://' + host + ':' + port + route + method;
            _request.post(
                url,
                {form: data},
                function (error, response, body) {
                    if (response === undefined) {
                        console.log("POST data cannot reach destination");
                    }
                    if (!error && response.statusCode == 200) {
                        success(req, res, data);
                    }
                    else {
                        failure(req, res, error, data);
                    }
                }
            );
        }

        return this;
    }

    module.exports = post;

})();