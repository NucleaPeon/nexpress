/** NodeJS Nexpress: Easy web hosting with usability in mind
 *
 * Author: Daniel Kettle
 * Email: initial.dann@gmail.com
 * Website: https://github.com/NucleaPeon/nexpress
 *
 * NOTES:
 *
 * - Internal caching is disabled by default so changes appear. Set cache time (ms)
 *   to begin caching for resources.
 *
 *
 */

var _http = require('http');
var mime = require('mime-types');
var path = require('path');
var fs = require('fs');
var querystring = require('querystring');
var _ssi = require('ssi');
var _request = require('request');

/**
 * Instantiation and export of the nexus function.
 *
 * @params: options: {} with the following possible keywords:
 *      - {port: int}: Port for the server to listen on by default
 *      - {timeout: int}: Timeout for each request
 *
 */
(function() {

    var nexus = function(options) {
        /** Default Options
         *  Port: 8080,
         *  timeout: 25000 (2.5 s)
         */
        this.options = {
            port: 8080,
            timeout: 25000
        };

        /**
         * Set the default port (affects all http(s) servers)
         *
         * @params: value: int value of the port to use
         */
        this.port = function(value) {
            if (value !== undefined)
                this.options.port = value;
        }

        /**
         * Set the default timeout (affects all http(s) servers)
         *
         * @params: value: int value of timeout to use
         */
        this.timeout = function(value) {
            if (value !== undefined)
                this.options.timeout = value;
        }

        /**
         * Handle errors that occur within this process
         *
         * TODO: include response object and redirect according to
         * error message
         *
         */
        this.error = function(err) {
            console.log("ERROR");
            console.log(err);
        }

        /**
         * Sets up an http server
         *
         * @returns: {} with the following functions built in:
         *      - listen(): start the http server listening on port
         *      - favicon(): convenience method for setting a favicon
         *      - staticDir(): Set the contents of a directory at a specific route
         *      - ssi(): Compile files with ssi tags into expanded files using a regex
         *
         * TODO: Logging mechanism that is submitted to .go() as a success and failure callback
         */
        this.http = function() {
            // Create server that directs method requests to their appropriate parsers
            var _get = new (require('./lib/get.js'))();
            var _post = new (require('./lib/post.js'))();

            var server = _http.createServer(function(req, res) {
                if (req.method == "GET") {
                    get.go(req, res);
                }
                else if (req.method == "POST") {
                    post.go(req, res);
                }
                else {
                    console.log(req.method + " not supported");
                }
            });

            var port = this.options.port;

            // RETURN
            return {
                listen: function(newport) {
                    return (newport === undefined) ? server.listen(port) : server.listen(newport);
                },
                favicon: function(location, ctime) {
                    get.route("/favicon.ico", location, ctime);
                    return location;
                },
                staticDir: function(location, alias, ctime) {
                    get.staticDir(location, alias, ctime);
                    return alias;
                },
                ssi: function(input, output, regex) {
                    var includes = new _ssi(input, output, regex);
                    includes.compile();
                    return output;
                },
                post: _post,
                get: _get
            };
        }

        /**
         * Sets up an https server
         *
         * @returns: {} with the following functions built in:
         *      - ssi(): Compile files with ssi tags into expanded files using a regex
         *
         */
        this.https = function() {
            return {
                ssi: function(input, output, regex) {
                    var includes = new _ssi(input, output, regex);
                    includes.compile();
                    return output;
                }
            };
        };

        /**
         * Compile files with ssi tags into expanded files using a regex
         *
         * ssi() can be included in http(s) servers in addition to here because they
         * perform the action once, not dependent on having the server running.
         * For convenience, the method is placed into both servers as well.
         *
         */
        this.ssi = function(input, output, regex) {
            var includes = new _ssi(input, output, regex);
            includes.compile();
            return output;
        };

        return this;
    };

    module.exports = nexus();
})();