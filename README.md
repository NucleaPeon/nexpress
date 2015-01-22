# nexpress
Not express.js: An easier to use starting module for serving web content

**Many nodejs projects and tutorials rely on the express.js library.**

Personally, I have found the documentation and tutorials written for express.js to be lacking.
nexpress.js is a simple, straightforward way to get a functional website up without having to read up on _how_ everything fits together.
It also frees up the user to focus on how their site works.

### Recent Updates

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
    
    http.listen();


Code is changing frequently, not recommended for use in production environments.
