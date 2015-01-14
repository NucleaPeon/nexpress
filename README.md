# nexpress
Not express.js: An easier to use starting module for serving web content

**Many nodejs projects and tutorials rely on the express.js library.**

Personally, I have found the documentation and tutorials written for express.js to be unsatisfactory. nexpress.js is a simple, straightforward way to get a functional website up without having to read up on _how_ everything fits together. It also frees up the user to focus on how their site works.

### Recent Updates

* 01/14/2015:  Added template functionality (similar to SSI) to enable pages compiled from multiple sources

### Example Options and Instantiation

    var options = {
        port: 3000,
        request: {
            socket: {
                timeout: 20000 
            }
        },
        templates: {
            "/auth/dashboard": ["./auth/dashboard.html"],
            "/test": ["header.html", "testbody.txt", "footer.html"]
        },
        routes: {
            GET: {
                  "/": "./public/index.html",
            },
            POST: { 
              "/login": "./auth/dashboard.html",
              "/logout": "http://www.google.com/"
            }
        },
        codes: {
            404: "/errors/404.html",
            403: "/errors/403.html"
        },
        static: [
            // Paths are absolute when hosted
            "./public/", 
            "./static/",
            "./errors/"
        ],
        favicon: "./static/favicon.ico"
    }

    var nexus = require('nexpress')(options);
    
In this code, you specify port, routes, static directories of files and a favicon without having any knowledge of the http module, data is up front.

Error codes are managed automatically if they exist in the options.

In later versions of nexpress I will include database connectors and authentication modules, as well as move options into their own file to reduce code clutter.