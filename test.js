var request = require('superagent');
var expect = require('expect.js');

var nexus = require('./nexpress/nexpress.js');

describe('Default Option Set', function(){
  it('should be set to default options', function(){
      expect(nexus.options).to.exist;
      expect(nexus.options.port).to.equal(8080);
      expect(nexus.options.timeout).to.equal(25000);
  });
});

var post = new (require('./nexpress/lib/post.js'))();
describe('HTTP Method callables', function() {
    it('should have the following', function() {
        var http = nexus.http();
        expect(http).to.exist;
        expect(http.listen).to.exist;
        expect(http.favicon).to.exist;
        expect(http.staticDir).to.exist;
        expect(http.ssi).to.exist;
        expect(http.post).to.exist;

        post.create('192.168.1.9', 2548, "/WebServices/UserWebService.asmx/GetCurrentUserDocument",
                                        {},
                                        function() { console.log("Success"); },
                                        function() { console.log("Failure"); });
    });
});

describe('Custom Option Set', function() {
    it('should detect change in options', function() {
        expect(nexus.options).to.exist;
        expect(nexus.options.port).to.equal(8080);
        nexus.port(3000);
        expect(nexus.options.port).to.equal(3000);
        expect(nexus.options.timeout).to.equal(25000);
        nexus.timeout(30000);
        expect(nexus.options.timeout).to.equal(30000);
    });
});


var get = new (require('./nexpress/lib/get.js'))();
describe('GET Routes', function() {
    it('should have default / -> ./index.html route to start', function() {
        expect(get).to.exist;
        expect(get.route).to.exist;
        expect(get.routes).to.exist;
        expect(get.getRoutes).to.exist;
        expect(get.getRoutes()).to.be.an('object');
        expect(Object.keys(get.getRoutes()).length).to.equal(1);
        expect(get.redirects).to.exist;
        expect(get.getRedirects()).to.exist;
        get.redirect("/google", "http://www.google.com");
        expect(Object.keys(get.getRedirects()).length).to.equal(1);
        expect(get.readFile).to.exist;
        expect(get.displayAsHtml).to.exist;
        // This reassigns but does not add new route, since / is default
        get.route("/", "./another/index.html");
        expect(Object.keys(get.getRoutes()).length).to.equal(1);
        get.route("/404", "./404.html");
        expect(Object.keys(get.getRoutes()).length).to.equal(2);
        expect(get.getRoutes()["/"]).to.exist;
        expect(get.getRoutes()["/"]).to.equal("./another/index.html");
        expect(get.remove).to.exist;
        get.remove("/");
        expect(Object.keys(get.getRoutes()).length).to.equal(1);
        expect(get.go).to.exist;
    });
});

describe('POST Routes', function() {
    it('should return json data for example', function() {
        expect(post.route).not.to.be(undefined);
        expect(post.getRoutes).not.to.be(undefined);
        expect(post.go).not.to.be(undefined);
        post.route("/login");
        expect(Object.keys(post.getRoutes()).length).to.equal(1);
    });
});

describe('SSI', function() {
    it('should exist', function() {
        expect(nexus.ssi).to.exist;
    });
});
