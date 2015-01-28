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
var get = new (require('./lib/get.js'))();
var post = new (require('./lib/post.js'))();
var mime = require('mime-types');
var path = require('path');
var fs = require('fs');
var querystring = require('querystring');
var _ssi = require('ssi');
var _request = require('request');

(function() {

    var nexus = function(options) {

        this.get = get;
        this.post = post;

        // Default options:
        this.options = {
            port: 8080,
            timeout: 25000
        };

        this.port = function(value) {
            if (value !== undefined)
                this.options.port = value;
        }

        this.timeout = function(value) {
            if (value !== undefined)
                this.options.timeout = value;
        }

        this.error = function(err) {
            console.log("ERROR " + err);
        }

        this.http = function() {
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
                }
            };
        }

        this.https = function() {
            return {
                ssi: function(input, output, regex) {
                    var includes = new _ssi(input, output, regex);
                    includes.compile();
                    return output;
                }
            };
        };

        this.ssi = function(input, output, regex) {
            var includes = new _ssi(input, output, regex);
            includes.compile();
            return output;
        };


        return this;
    };

    module.exports = nexus();
})();