var querystring = require('querystring');
var fs = require('fs');
var mime = require('mime-types');
var path = require('path');
var func = require('function.create');
var _request = require('request');
var tag = require('./tagparse.js');
var Cookies = require('cookies');

/**
 * Instantiation and export of the nexpress post function.
 *
 * TODO: This module should be pluggable -- ie. it should be an option
 * and users should be able to control posts as they see fit in case
 * they use other plugins or modules to perform their web services.
 */
(function() {


    /**
     * post() function that is exported and returns itself.
     *
     */
    var post = function() {

        /** Simple route table
         * {"hosted address for page": function.to.parse.responses}
         *
         * @see this.respond
         * @see this.route
         * @see wiki FIXME: link to wiki article
         */
        var routes = {};

        var tagmod = null;

        var session_ref = {};

        /**
         * Set a route from the address that links to the target.
         *
         * Target MUST be a method, and that method must be carefully crafted
         * to match the usability specifications. Unfortunately in order to
         * ensure that POST functionality remains easy to develop for, it requires
         * some additional effort when creating the functionality.
         *
         * A brief explanation: An address must link to the target.
         * 1) The target must be a method reference. This method reference serves parameters
         *    that the user fills out with user-determined data, such as a success callback or
         *    a page file to load.
         * 2) The first method reference must return ANOTHER method reference. We use Function.create()
         *    to produce a lambda/anonymous function that contains method parameters "req", "res" and "data"
         *    standing for Request, Response, and the Post data (forms) respectively.
         * 3) The route is created with user defined data while defining the target and then when
         *    called, this POST object will manage the req, res, and data for the call.
         *
         * Keep in mind that POST does not handle presenting a page like GET does. In fact, if you
         * don't want your web app to hang, it is recommended that for the success and failure
         * callbacks (you need to implement those parameters), you utilize the post.respond._____
         * methods.
         *
         * @see this.respond
         */
        this.route = function(address, target) {
            routes[address] = target;
        };

        /**
         * @returns {} of all set routes at the time of calling
         */
        this.getRoutes = function() {
            return routes;
        }

        /**
         * Sets the session object for GET requests. Some GET requests may access
         * the session object, such as for tagging.
         *
         * @param session dictionary with session-held data in it.
         *
         */
        this.session = function(s) {
            session_ref = s;
        }

        /**
         * Responds to the caller in JSON format of the error and message
         * using {error: _____, message: ______}.
         */
        this.error = function(code, message) {
            res.writeHead(code, {"Content-Type": "application/json"});
            res.end(JSON.stringify({"error": code, "message": message}));
        }

        this.tagger = function(tag_module) {
            tagmod = tag_module;
        }

        /**
         * Method that is used to initiate tagging, where data in between a tag:
         *   {{ ... }}
         * is expanded to present data from the supplied json object or from
         * strings within quotes.
         *
         * {{ "Hello World" }} ==> Hello World
         * {{ json_key }} ==> json[json_key] (if method, call method w/ no params else display)
         *
         * @param extension of file to parse; this prevents tagging from being invoked on files
         *                  that don't have tagging in them at all, but allows for specifying tag file types.
         *                  Ex: images, binary files won't be looked in for tagging, but .html will.
         * @param data the contents of which is in binary form and submitted to the response object
         * @param json the session object usually, or a supplied dictionary/json.
         *
         * @returns encoded binary data with tags modified.
         */
        var parseData = function(extension, data, json) {
            return tagmod.parseData(extension, data, json).toString('binary');
        }

        /**
         * JSON method to read a page and present it
         * Returns a method reference for post.go to parse.
         *
         * @param page on the local filesystem to read
         */
        this.page = function(page) {
            return Function.create(null, function(req, res) {
                res.writeHead(200, {"Content-Type": "text/html"});
                fs.readFile(page, function(err, data) {
                    if (err) throw err;

                    var locext = page.split('.');
                    if (tagmod !== null) {
                        var cookies = new Cookies(req, res);
                        sessioncookie = cookies.get("session_id");
                        data = parseData(locext[locext.length - 1], data.toString('utf8'), session_ref);
                    }

                    res.write(data);
                    res.end();
                });
            });
        }

        /**
         * Methods that are used to respond to POST calls.
         *
         * displayJSON: Displays the data that the POST sends. This is mainly
         *              for debugging purposes
         * page:        Provided that {page: "path/to/page"} is provided in the data,
         *              this will read and return that file.
         * error:       Displays an html error page in response to what could be
         *              a failure or bad data
         *
         */
        this.respond = {
            displayJSON: function(req, res, responsedata) {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(responsedata));
            },
            page: function(req, res, responsedata) {
                if (responsedata.page !== undefined) {
                    res.writeHead(200, {"Content-Type": mime.lookup(path.basename(responsedata.page))});
                    fs.readFile(responsedata.page, function(err, data) {
                        if (err) throw err;

                        var locext = responsedata.page.split('.');
                        if (tagmod !== null)
                            data = parseData(locext[locext.length - 1], data.toString('utf8'), session_ref);

                        res.write(data);
                        res.end();
                    });
                }
                else {
                    res.writeHead(404, {"Content-Type": "text/html"});
                    res.end("<b>Post encountered an error, `page` not submitted</b>");
                }
            },
            error: function(req, res, responsedata, e) {
                res.writeHead(404, {"Content-Type": "text/html"});
                res.end("<b>Post encountered an error: " + e + ", " + responsedata + "</b>");
            },
            ping: function(req, res, responsedata) {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({date: new Date()}));
            },
            logger: function(req, res, data) {
                console.log(req);
                console.log(res);
                console.log(data);
                res.end();
            }

        }

        /**
         * Handles parsing and deserialization of POST data into a dictionary object
         * and submits it to the functions that are defined in routes in order to
         * respond appropriately.
         *
         * If the route is not defined, returns an error page using this.error.
         * @see this.error
         *
         * @param req request object
         * @param res response object
         * @param success callback when post succeeds (optional)
         * @param failure callback when post fails (optional)
         */
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
                    error(404, "Request to " + req.url + " not found");
                }
            });
        }

        /**
         * Method to submit a POST request to an external source
         * Uses the requests nodejs module
         *
         * The req and res objects are submitted through the go() method into the
         * routing object.
         *
         * All POSTable objects require (req, res, data) parameters to be called.
         * Return a Function object using Function.create(null, function(req, res, data) { ... });
         * and it will get called appropriately.
         *
         * @param req request object
         * @param res response object
         * @param host hostname
         * @param port port to call
         * @param route the path to call from the root of the webserver. Leave blank for root
         * @param method to call on webserver. (optional) Used for calling asmx page methods
         * @param data to submit to the target method or api
         * @param success callback on success (optional) requires parameters "req", "res" and "data"
         * @param failure callback on failure (optional) requires parameters "req", "res", "error" and "data"
         */
        this.create = function(req, res, host, port, route, method, data, success, failure) {
            console.log("Creating POST");
            var url = 'http://' + host + ':' + port + route + method;
            console.log(url);
            _request.post(
                url,
                {form: data},
                function (err, response, body) {
                    if (response === undefined) {
                        console.log("POST data cannot reach destination");
                    }
                    if (!err && response.statusCode == 200) {
                        if (success !== undefined)
                            success(req, res, data);
                        else {
                            res.writeHead(404, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({error: "no success method"}));
                        }
                    }
                    else {
                        if (failure !== undefined) {
                            res.writeHead(404, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({error: "an error occured or status code not 200"}));
                        }
                        else {
                            res.writeHead(404, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({error: "no failure method"}));
                        }
                    }
                }
            );
        }

        return this;
    }

    module.exports = post;

})();