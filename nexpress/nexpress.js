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
var tls = require('tls');
var tagparse = require('./lib/tagparse.js');

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

        this.getSimpleTagger = function() {
            return tagparse;
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
                    _get.go(req, res);
                }
                else if (req.method == "POST") {
                    _post.go(req, res);
                }
                else {
                    console.log(req.method + " not supported");
                }
            });

            server.setTimeout(this.options.timeout);
            var port = this.options.port;

            return {
                listen: function(newport) {
                    return (newport === undefined) ? server.listen(port) : server.listen(newport);
                },
                favicon: function(location, ctime) {
                    _get.route("/favicon.ico", location, ctime);
                    return location;
                },
                staticDir: function(location, alias, ctime) {
                    _get.staticDir(location, alias, ctime);
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
         * Sets up an https server. Secure HTTP server must have its port and
         * credential files manually set. Currently is just an echo server.
         *
         * See http://nodejs.org/api/tls.html#tls_tls_ssl
         * for creating server keys
         *
         *
         * @param privateKeyPath path to the private key for ssl
         * @param certificatePath path to the certificate (public file)
         * @param port for communicating securely (default: 8000)
         *
         * @returns JSON object with functions:
         *      ssi: compile routes from an input directory into expanded files in output
         *           using the matching object (regex) parameter.
         *
         */
        this.https = function() {
            var _get = new (require('./lib/get.js'))();
            var _post = new (require('./lib/post.js'))();


            var httpsOptions = {
                key: fs.readFileSync('./server-key.pem'),
                cert: fs.readFileSync('./server-cert.pem'),
                port: 8000

                // This is necessary only if using the client certificate authentication.
                //requestCert: true,

                // This is necessary only if the client uses the self-signed certificate.
                //ca: [ fs.readFileSync('client-cert.pem') ]
            };

            var server = tls.createServer(httpsOptions, function(cleartextStream) {
                console.log('server connected',
                            cleartextStream.authorized ? 'authorized' : 'unauthorized');
                cleartextStream.write("welcome!\n");
                cleartextStream.setEncoding('utf8');
                cleartextStream.pipe(cleartextStream);
            });
            server.listen(httpsOptions.port, function() {
                console.log('server bound on ' + httpsOptions.port);
            });
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