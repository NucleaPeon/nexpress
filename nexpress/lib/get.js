var _cache = require('js-cache');
var path = require('path');
var fs = require('fs');
var mime = require('mime-types');
var _url = require('url');
var file = require('file');

/**
 * Instantiation and export of the nexpress get function.
 *
 * TODO: This module should be pluggable -- ie. it should be an option
 * and users should be able to control gets as they see fit in case
 * they use other plugins or modules to perform their web services.
 */
(function () {

    /**
     * get() function that is exported and returns itself.
     */
    var get = function() {

        /** Simple route table
            * {"hosted address for page": "file contents to host"}
            */
        var routes = {"/": "./index.html"};

        /** Simple route table for redirects:
            * {"hosted address for page": "page to read"}
            */
        var redirects = {};

        /**
         * Enables displaying of various pages with various codes (404, 200, etc),
         * a common function with GETS. This method simplifies and reuses code.
         *
         * Callback available if user wants to do something fancy.
         *
         * @param res response object
         * @param code page code (404, 200)
         * @param headers for displaying a type of document in the browser
         * @param data the contents to write
         * @param callback with parameters (res, data) for manipulating content
         *        in a non-default method.
         *
         */
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

        /**
         * Convenience method calls for displaying errors.
         * It is recommended that the user build their own themed error pages
         * and route them.
         * Example: /404 links to a 404.html page
         *
         * Methods here should be overridden.
         * get.errors.404 = get.serveCacheContent
         *
         * errors:
         *      404
         *
         *
         */
        var errors = {404: function(location, res, data) {
            // data can be undefined.
            displayAsHtml(res, 404, {"Content-Type": "text/html"},
                          "404 Page Not Found: <b>" + location + "</b>");
        }};

        /**
         * Convenience method for displaying content from a file on the filesystem.
         *
         * @param location of the file, ex: ./www/myfile.html
         * @param res response object
         *
         * If an error occurs, error page will display the message and then through the
         * error.
         */
        this.readFile = function(location, res) {
            console.log("Attempting to read " + location);
            fs.readFile(location, function(err, data) {
                if(err) {
                    displayAsHtml(res, 404, {"Content-Type": "text/html"},
                        "404 Page Not Found: <b>" + location + "</b><code>" + err + "</code>");
                    throw err;
                }
                displayAsHtml(res, 200, {"Content-Type": mime.lookup(path.basename(location))},
                    data);
            });
        }

        /**
         * Returns the get routes in a JSON object
         */
        this.getRoutes = function() {
            return routes;
        }

        /**
         * Returns the redirect routes in a JSON object
         */
        this.getRedirects = function() {
            return redirects;
        }

        /**
         * Sets a route and if a ctime (cache time) is submitted, caches that object.
         *
         * @param address to the route. Ex: "/"
         * @param target when the route is invoked. Ex: "./index.html"
         * @param ctime optional time in milliseconds for caching. Ex: 3600000
         */
        this.route = function(address, target, ctime) {
            if (ctime !== undefined) {
                this.cache
            }
            routes[address] = target;
        };

        /**
         * Removes a route that was been specified if it exists.
         *
         * @param route address. Ex: "/silly/route/to/delete"
         */
        this.remove = function(address) {
            _cache.get(address, function(value) {
                _cache.del(value);
            });
            if (routes[address] !== undefined) {
                delete routes[address];
            }
        }

        /**
         * External Redirect. Do not call directly, this is based on redirect routes.
         *
         * @param address to redirect to. Ex: http://www.google.com
         * @param res response object
         *
         */
        this.extRedirect = function(address, res) {
            var body = 'Redirecting to ' + address;
            res.writeHead(302, {
                'Content-Type': 'text/plain',
                'Location': address,
                'Content-Length': body.length
            });
            res.end(body);
        }

        /**
         * Redirects the user from the address to the target.
         *
         * @param address get route
         * @param target external address to redirect to
         */
        this.redirect = function(address, target) {
            redirects[address] = target;
        }

        /**
         * Attempts to serve cached content
         *
         * @param url target route on the web server
         * @param res response object
         * @param data (optional) not yet used FIXME
         */
        this.serveCacheContent = function(url, res, data) {
            _cache.get(url, function(value) {
                displayAsHtml(res,
                            200,
                            {"Content-Type": mime.lookup(path.basename(routes[url]))},
                            value);
                return;
            });
            if (routes[url] !== undefined) {
                // Not in cache, read directly
                readFile(url, res);
            }
            else {
                // Not in cache or routing table
                errors[404](url, res);
            }
        }

        /**
         * Cache a file from the filesystem
         *
         * @param address the route that accesses the content, should be the same
         *        as the route.
         * @param target on the filesystem
         * @param time in milliseconds to cache the file
         */
        this.cache = function(address, target, time) {
            fs.readFile(target, function(err, data) {
                if (err) {
                    throw err;
                }
                _cache.set(address, data, time);
            });
        }

        /**
         * Forces all non-hidden files in a directory (not including sub-directories)
         * into a route based on the alias supplied.
         * Ex: if alias = "/static" and the folder = "./www/staticfiles", all files in
         * the staticfiles directory (file1.txt, file2.txt) will be placed into the alias
         * route: /static/file1.txt --> ./www/staticfiles/file1.txt
         *
         * This does mean that if aliases are not unique, files may be overwritten.
         *
         * @param folder location on the filesystem
         * @param alias prepended route for all files in the folder
         * @param cacheTime optional time to cache each file located in the folder
         *
         */
        this.staticDir = function(folder, alias, cacheTime) {
            var a = (alias === undefined) ? "" : alias;
            var filename = '';
            if ((a.length > 0) && (a.substring(0, 1) != path.sep)) {
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
                        if (cacheTime !== undefined) {
                            this.cache(a + path.sep + filename,
                                       files[i],
                                       cacheTime);
                        }
                        routes[a + path.sep + filename] = files[i];
                    }
                    else {
                        // Common use case: relative paths
                        if (cacheTime !== undefined) {
                            this.cache(a + path.sep + filename,
                                       files[i],
                                       cacheTime);
                        }
                        routes[a + path.sep + filename] = files[i];
                    }
                }
            });

        }

        /**
         * When the server detects a GET, it calls this method to handle the details
         *
         * @param req request object
         * @param res response object
         * @param error (unused) error callback FIXME
         * @param success (unused) success callback FIXME
         * @param failure (unused) failure callback FIXME
         *
         * Because we are dealing with GETS, this handles detecting get parameters,
         * finding the route and redirecting the response to either read the file,
         * the cache, error, or redirect to an external source.
         *
         */
        this.go = function(req, res, error, success, failure) {
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
            var contents = _cache.get(url);
            if (contents === undefined) {
                if (routes[url] === undefined) {
                    errors[404](url, res); // no content, so leave undefined
                }
                else {
                    console.log("Reading route " + routes[url]);
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
        }

        return this;
    }

    module.exports = get;
})();