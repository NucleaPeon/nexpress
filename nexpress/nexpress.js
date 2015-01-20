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
     * Nexus (nexpress) object contains the following notable methods:
     *
     *  - requestTimeout(time): Change default timeout for requests. This must
     *    be called BEFORE the http server is created and cannot be changed once
     *    set currently.
     *
     *  - cacheTime(time): Change default duration for content in cache
     *
     *  - http(): get web server
     *
     * @constructor **/
    var nexus = function(options) {
        /** Define public methods: **/

        // DEFAULT OPTIONS
        this.options = {
            port: 8080,
            timeout: 25000,
            cacheTime: undefined,
            routes: {"GET": {},
                     "POST": {}}
        };

        this.routes = {POST: {},
                       GET: {"/" : "index.html"}};

        this.redirects = {}

        this.setOptions = function(options) {
            if (options !== undefined) {
                var keys = Object.keys(options); // List of all user-supplied options
                var innerKeys = []; // initialize for checking POST/GET
                for (var i=0; i < keys.length; i++) {
                    if (keys[i] == "routes") {
                        var j = 0;
                        if (options.routes.GET !== undefined) {
                            innerKeys = Object.keys(options.routes.GET);
                            for (; j < innerKeys.length; j++) {
                                this.routes.GET[innerKeys[j]] = options.routes.GET[innerKeys[j]];
                            }
                        }
                        j=0;
                        innerKeys = [];
                        if (options.routes.POST !== undefined) {
                            innerKeys = Object.keys(options.routes.POST);
                            for (; j < innerKeys.length; j++) {
                                this.routes.POST[innerKeys[j]] = options.routes.POST[innerKeys[j]];

                            }
                        }
                    } else {
                        this.options[keys[i]] = options[keys[i]];
                    }
                }
            }
        };

        // Handle option assignments
        this.setOptions(options);

        this.cacheTime = function(time) {
            this.options.cacheTime = time;
        }

        this.cachePage = function(path) {
            // check if url, if not, read into cache
            console.log("FIXME: " + path);
            console.log(path + ", " + this.options.cacheTime);
        }

        this.requestTimeout = function(time) {
            console.log("Changing time");
            this.options.timeout = time;
            console.log(this.options.timeout);
        }

        /**
         * http
         *
         * Call .listen() on the server once it is returned to start.
         * Default port: 8080
         *
         * Methods that can be called within http object:
         *      - route(target, path, cacheTime): create a route from the <path>
         *        that will lead the user to the <target>, with optional cacheTime for
         *        the content of the <target>.
         *
         *      - routes(): Return all routes in a json object
         *
         *      - listen(port): start the web server (http object). Specify a <port> or
         *        leave unsubmitted to use the default (8080) or submitted option {port: [int]}
         *
         *      - favicon(path, cacheTime): convenience method for specifying the favicon using its
         *        <path>. Specify optional <cacheTime>.
         *        This method uses route() to create a "/favicon.ico" to the icon.
         *
         *      - redirect(route, url): When the user hits the <route> specified, redirect
         *        to the <url>.
         *        Example: redirect("/google", "http://www.google.com")
         *
         *      - redirects(): Returns all redirects in a json object.
         *
         *      - staticDir(folder, cacheTime): specify optional <cacheTime> for all files in <folder>.
         *
         *
         * @returns http server.listen(port) as a function. Uses a preset so no
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

            this.calcPOST = function(req, res, cache, opts, cb) {

            }

            /**
             * @constructor
             *
             * Contains the http server
             */
            var server = http.createServer(function (req, res) {
                req.setTimeout(reqTimeout);
                var url = req.url;
                if (routes[req.method][url] !== undefined || redirects[url] !== undefined) {
                    // TODO: Cache fetching, file fetching, redirection, etc.
                    if (redirects[url] !== undefined) {
                        console.log("redirecting " + redirects[url]);
                        redirection(redirects[url], res);
                    }
                    else {
                        if (routes[req.method][url].substring(0, 7) == "http://" || routes[req.method][url].substring(0, 4) == "www.") {
                            console.log("redirecting");
                            redirection(routes[req.method][url], res);
                        }
                        else {
                            console.log("not redirecting");
                            // Fetch as a file, determine file mimetype
                            fs.readFile(routes[req.method][req.url], function(err, data) {
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
                        var access = ("POST" == method) ? "POST" : "GET";
                        // TODO: method (GET, POST, "*"), default to both
                        routes[access][path] = target;
                        if (cacheTime !== undefined) {
                            cacheTime(path, cacheTime);
                        }
                        console.log(routes);
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
                        routes["GET"]["/favicon.ico"] = path;
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
                    staticDir: function(folder, method, cacheTime) {
                        var access = (method == "POST") ? "POST" : "GET";
                        file.walk(folder, function(ds, acc, m, cb) {
                            // cb is list of files
                            for (var i=0; i < cb.length; i++) {
                                // In the edge case user specifies root folder,
                                // do not append path.sep to route.
                                if (cb[i].substring(0, 1) == ".") {
                                    continue;
                                }
                                else if (cb[i].substring(0, 1) == path.sep) {
                                    routes[access][cb[i]] = cb[i];

                                }
                                else {
                                    routes[access][path.sep + cb[i]] = cb[i];
                                }
                                // cache if not hidden file and cacheTime specified
                                if (cacheTime !== undefined) {
                                    cachePage(cb[i], cacheTime);
                                    routes[access][cb[i]] = cb[i];
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
            new ssi(input, output, matcher).compile();
        }

        return this;
    };

    module.exports = nexus;
})();
