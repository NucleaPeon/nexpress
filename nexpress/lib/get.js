var cache = require('js-cache');
var path = require('path');
var fs = require('fs');
var mime = require('mime-types');
var _url = require('url');
var file = require('file');

(function () {

    var get = function() {

        /** Simple route table
            * {"hosted address for page": "file contents to host"}
            */
        var routes = {"/": "./index.html"};

        /** Simple route table for redirects:
            * {"hosted address for page": "page to read"}
            */
        var redirects = {};

        var displayAsHtml = function(res, code, headers, data, callback) {
            res.writeHead(code, headers);
            if (callback === undefined) {
                res.write(data);
                res.end();
            }
            else {
                callback(res, data);
            }
        }

        var errors = {404: function(location, res, data) {
            // data can be undefined.
            displayAsHtml(res, 404, {"Content-Type": "text/html"},
                          "404 Page Not Found: <b>" + location + "</b>");
        }};

        this.readFile = function(location, res) {
            console.log("Attempting to read " + location);
            fs.readFile(location, function(err, data) {
                if(err) {
                    displayAsHtml(res, 404, {"Content-Type": "text/html"},
                        "404 Page Not Found: <b>" + location + "</b>");
                    throw err;
                }
                displayAsHtml(res, 200, {"Content-Type": mime.lookup(path.basename(location))},
                    data);
            });
        }


        this.getRoutes = function() {
            return routes;
        }

        this.getRedirects = function() {
            return redirects;
        }

        this.route = function(address, target, ctime) {
            if (ctime !== undefined) {
                console.log(target);
                fs.readFile(target, function(err, data) {
                    if (err) {
                        throw err;
                    }
                    cache.set(address, data, ctime);
                });
            }
            routes[address] = target;
        };

        this.remove = function(address) {
            cache.get(address, function(value) {
                cache.del(value);
            });
            if (routes[address] !== undefined) {
                delete routes[address];
            }
        }

        this.extRedirect = function(address, res) {
            var body = 'Redirecting to ' + address;
            res.writeHead(302, {
                'Content-Type': 'text/plain',
                'Location': address,
                'Content-Length': body.length
            });
            res.end(body);
        }

        this.redirect = function(address, target) {
            redirects[address] = target;
        }

        this.serveCacheContent = function(url, res, failure) {
            cache.get(url, function(value) {
                displayAsHtml(res,
                            200,
                            {"Content-Type": mime.lookup(path.basename(routes[url]))},
                            value);
                return;
            });
            failure();
        }

        this.staticDir = function(folder, alias, cacheTime) {
            var a = alias;
            var filename = '';
            if (a.substring(0, 1) != path.sep) {
                a = path.sep + alias;
            }
            file.walk(folder, function(n, dirPath, dirs, files) {
                for(var i=0; i<files.length; i++) {
                    filename = files[i].split(path.sep);
                    filename = filename[filename.length - 1];
                    if (filename.substring(0, 1) == ".") {
                        continue;
                    }
                    else if (files[i].substring(0, 1) == path.sep) {
                        // Absolute Paths
                        routes[a + path.sep + filename] = files[i];
                    }
                    else {
                        // Common use case: relative paths
                        routes[a + path.sep + filename] = files[i];
                        //routes[path.sep + files[i]] = files[i];
                    }
                }
                console.log(routes);
            });

        }

        this.go = function(req, res, error, success, promise) {
            var url_parts = _url.parse(req.url, true);
            var query = url_parts.query;
            var url = url_parts.pathname;
            // Check redirects for url, then redirect response if found
            if (redirects[url] !== undefined) {
                console.log("in redirects");
                if ((value.substring(0, 7) == "http://") || (value.substring(0, 5) == "www.")) {
                    extRedirect(value, res);
                }
                else {
                    console.log("Reading url " + url);
                    this.readFile(routes[url], res);
                }
                return; // With redirect, do no more
            };
            // Check cache for contents
            var contents = cache.get(url);
            if (contents === undefined) {
                if (routes[url] === undefined) {
                    errors[404](url, res);
                }
                else {
                    this.readFile(routes[url], res);
                }

            }
            else {
                // cache entirely depends on there being a route of it
                displayAsHtml(res,
                            200,
                            {"Content-Type": mime.lookup(path.basename(routes[url]))},
                            contents);
            }

            if (success !== undefined)
                success();
            if (promise !== undefined)
                promise()
        }

        return this;
    }

    module.exports = get;
})();