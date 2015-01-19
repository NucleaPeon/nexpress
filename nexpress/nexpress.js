/**
 * Require Statements:
 * */
var http = require('http');
var mime = require('mime-types');
var path = require('path');
var fs = require('fs');
var querystring = require('querystring');
var ssi = require('ssi');
var file = require('file');
var cache = require('js-cache');

/**
 * @constructor
 * Define and export the nexus function
 **/
(function () {
    /**
     * This function automatically associates "/" route with
     * "./index.html". This can be overwritten using
     * http.route("./anotherfile.html", "/"); and is purely for
     * convenience.
     *
     * Port defaults to 8080 unless otherwise set.
     *
     * @constructor **/
    var nexus = function(options) {
        /** Define public methods: **/

        this.options = {port: 8080,
            routes: {"/" : "index.html"},
            timeout: 25000,
            cacheTime: undefined
        };
        if (options !== undefined) {
            var keys = Object.keys(options);
            for (var i=0; i < keys.length; i++) {
                this.options[keys[i]] = options[keys[i]];
            }
        }

        this.routes = {};
        this.redirects = {}

        this.cacheTime = function(time) {
            this.options.cacheTime = time;
            console.log(this.options.cacheTime);
        }

        this.cachePage = function(path) {
            console.log(path + ", " + this.options.cacheTime);
        }

        this.requestTimeout = function(time) {
            this.options.timeout = time;
            console.log(this.options.timeout);
        }

        /**
         * http
         *
         * Call .listen() on the server once it is returned to start.
         * Default port: 8080
         *
         * @returns http server.listen(port) as a function. Preset so no
         *          parameters are required to launch at specified port.
         *
         */
        this.http = function() {
            var reqTimeout = this.options.timeout;

            this.redirection = function(url, res) {
                var body = 'Redirecting to ' + url;
                res.writeHead(302, {
                    'Content-Type': 'text/plain',
                    'Location': url,
                    'Content-Length': body.length
                });
                res.end(body);
            };

            var server = http.createServer(function (req, res) {
                req.setTimeout(reqTimeout);
                console.log(reqTimeout);
                var url = req.url;
                if (routes[url] !== undefined || redirects[url] !== undefined) {
                    // TODO: Cache fetching, file fetching, redirection, etc.
                    if (redirects[url] !== undefined) {
                        console.log("redirecting " + redirects[url]);
                        redirection(redirects[url], res);
                    }
                    else {
                        console.log("not redirecting");
                        if (routes[url].substring(0, 7) == "http://" || routes[url].substring(0, 4) == "www.") {
                            console.log("redirecting");
                            redirection(routes[url], res);
                        }
                        else {
                            // Fetch as a file, determine file mimetype
                            fs.readFile(routes[req.url], function(err, data) {
                                if (err) throw err;
                                res.writeHead(200, {"Content-Type": mime.lookup(path.basename(routes[req.url]))})
                                res.end(data);
                            });
                        }
                    }
                }
                else {
                    res.writeHead(404, {"Content-Type": "text/html"});
                    res.end("Error: Page Not Found");
                }

            });

            var port = this.options.port;

            return {route: function(target, path, method, cacheTime) {
                        // TODO: method (GET, POST, "*"), default to both
                        routes[path] = target;
                        if (cacheTime !== undefined) {
                            cacheTime(path, cacheTime);
                        }
                    },
                    routes: function() {
                        // Report routes
                        return routes;
                    },
                    listen: function(newport) {
                        // If param "newport" is not specified, give it port (option) or 8080
                        if (newport === undefined) {
                            if ( port === undefined ) { port = 8080; }
                        }
                        else {
                            port = newport;
                        }
                        return server.listen(port);
                    },
                    favicon: function(path, cacheTime) {
                        // Convenience method for specifying a favicon
                        routes["/favicon.ico"] = path;
                        if (cacheTime !== undefined) {
                            cachePage("/favicon.ico", cacheTime);
                        }
                    },
                    redirect: function(route, url) {
                        redirects[route] = url;
                    },
                    redirects: function() {
                        return redirects;
                    },
                    staticDir: function(folder, cacheTime) {
                        file.walk(folder, function(ds, acc, m, cb) {
                            //files = cb.split(",");
                            for (var i=0; i < cb.length; i++) {
                                // In the edge case user specifies root folder,
                                // do not append path.sep to route.
                                if (cb[i].substring(0, 1) == ".") {
                                    continue;
                                }
                                else if (cb[i].substring(0, 1) == path.sep) {
                                    routes[cb[i]] = cb[i];

                                }
                                else {
                                    routes[path.sep + cb[i]] = cb[i];
                                }
                                // cache if not hidden file and cacheTime specified
                                if (cacheTime !== undefined) {
                                    cachePage(cb[i], cacheTime);
                                    routes[cb[i]] = cb[i];
                                }
                            }
                        });
                    }

            }
        }

        /**
         * https
         *
         * Call .listen() on the server once it has returned to start.
         * https is a secure, encrypted communication server.
         **/
        this.https = function() {
            console.log("TODO: ssl https");
        }

        /**
         * ssi
         *
         * Adds files within the input directory to the output directory.
         * Files in the output directory can be used by ssi.
         * Matcher will allow access to files based on the expression used
         * ("*.html" allows only html files)
         *
         * @param input directory
         * @param output directory
         * @param matcher
         **/
        this.ssi = function(input, output, matcher) {
            console.log("Setting up ssi");
            var includes = new ssi(input, output, matcher);
            includes.compile();
        }

        return this;
    };

    module.exports = nexus;
})();
