# nexpress
Not express.js: An easier to use starting module for serving web content

**Many nodejs projects and tutorials rely on the express.js library.**

Personally, I have found the documentation and tutorials written for express.js to be unsatisfactory. nexpress.js is a simple, straightforward way to get a functional website up without having to read up on _how_ everything fits together. It also frees up the user to focus on how their site works.

### Recent Updates

* 01/22/2015:  Reduced reliance on options, allowing more async performance
* 01/14/2015:  Added template functionality (similar to SSI) to enable pages compiled from multiple sources. Use template keys as routes.

### Example Options and Instantiation

    // options no longer required, defaults are set inside nexus
    var options = {routes: {GET: {"/about": "about.html"}}};
    var nexus = require('nexpress')(options);

    // Set nexus options:
    nexus.requestTimeout(100000);
    nexus.ssi("ssi/", "generated/", "*.html");
    nexus.cacheTime(360000);
    nexus.cachePage("/favicon.ico"); // manual, optional caching

    // Create http server:
    var http = nexus.http();
    http.staticDir("static"); // Serves an entire directory static pages through GET
    http.favicon("./favicon.ico"); // Convenience method for favicon
    http.get("./index.html", "/"); // GETS take [file target] [webserver path]
    http.get("./404.html", "/404");
    // path to external page (will be fixed later for consistency with other calls)
    http.redirect("/google", "http://www.google.com");
    http.get("http://www.google.com", "/g");

    // Finally make server listen. Can specify port: http.listen(3000); or default to 8080
    http.listen();

In this code, you specify port, routes, static directories of files and a favicon without having any knowledge of the http module, data is up front.

Error codes are managed automatically if they exist in the options. ( **TODO** )

In later versions of nexpress I will include database connectors and authentication modules, as well as move options into their own file to reduce code clutter.

Do not yet use this module in production.
