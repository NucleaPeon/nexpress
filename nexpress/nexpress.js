/**
 * Require Statements:
 * */
var http = require('http');
var mime = require('mime-types');
var path = require('path');
var fs = require('fs');
var querystring = require('querystring');
var ssi = require('ssi');

/**
 * @constructor
 * Define and export the nexus function
 **/
(function () {
    /** @constructor **/
    var nexus = function(options) {
        /** Define public methods: **/

        this.options = {port: 8080,
            routes: {"/" : "index.html"}
        };
        if (options !== undefined) {
            var keys = Object.keys(options);
            for (var i=0; i < keys.length; i++) {
                this.options[keys[i]] = options[keys[i]];
            }
        }

        this.routes = {};
        console.log(this.options);
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
            var server = http.createServer(function (req, res) {
                if (routes[req.url] !== undefined) {
                    // TODO: Cache fetching, file fetching, redirection, etc.

                    // Fetch as a file
                    var res = res;
                    fs.readFile(routes[req.url], function(err, data) {
                        if (err) throw err;
                        res.writeHead(200, {"Content-Type": "text/html"})
                        res.end(data);
                    });
                }
                else {
                    res.writeHead(404, {"Content-Type": "text/html"});
                    res.end("Error: Page Not Found");
                }

            });

            var port = this.options.port;

            return {route: function(file, path) {
                        routes[path] = file;
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
                    redirect: function(route, url) {
                        var body = 'Redirecting to ' + url;
                        /**response.writeHead(302, {
                            'Content-Type': 'text/plain',
                            'Location': url,
                            'Content-Length': body.length
                        });
                        response.end(body);**/
                        console.log("REDIRECT TODO " + url);
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
            var includes = new ssi(input, output, matcher);
            includes.compile();
        }

        return this;
    };

    module.exports = nexus;
})();
