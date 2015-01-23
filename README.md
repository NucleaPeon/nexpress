# nexpress
Not express.js: An easier to use starting module for serving web content

**Many nodejs projects and tutorials rely on the express.js library.**

Personally, I have found the documentation and tutorials written for express.js to be lacking.
nexpress.js is a simple, straightforward way to get a functional website up without having to read up on _how_ everything fits together.
It also frees up the user to focus on how their site works.

### Recent Updates

* 01/23/2015:  Added SSI
* 01/22/2015:  Moved get and post to their own modules, added testing suite and most functionality added back in. (ssi todo)
* 01/21/2015:  Reduced reliance on options, allowing more async performance
* 01/14/2015:  Added template functionality (similar to SSI) to enable pages compiled from multiple sources. Use template keys as routes.

### Example Options and Instantiation

    var nexus = require('./nexpress/nexpress.js');
    var http = nexus.http();

    http.staticDir(".public/", "/public");
    http.staticDir("./static/", "/static");
    http.favicon("./static/favicon.ico");

    nexus.get.route("/", "./public/index.html");
    nexus.get.route("/404", "./errors/404.html");

    http.listen(3000); // Defaults to 8080

Optional Instantiation of nexpress:

`package.json`

    ...
    "dependencies": {
        "nexpress": "NucleaPeon/nexpress"
    },
    ...

`(starting .js file)`

    var nexus = require('nexpress');

### SSI

SSI is the ability to compile multiple pieces of html code into one file.
It is not specific to the web server, it's a compilation that can occur
at any time.

Nexpress enables the ssi() method both from your nexus and your http(s)
objects. Use it like this:

    nexus.ssi("input/", "output/", "*.shtml");

or

    http.ssi("input/", "output/", "*.shtml");



### Run Tests

    npm test

This depends on Mocha, you may have to re-run `npm install https://github.com/NucleaPeon/nexpress.git` to pull extra deps in.

**Code is changing frequently, not recommended for use in production environments.**
