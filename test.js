var request = require('superagent');
var expect = require('expect.js');

var nexus = require('./nexpress/nexpress.js');
var func = require('function.create');

describe('Default Option Set', function(){
  it('should be set to default options', function(){
      expect(nexus.options).to.exist;
      expect(nexus.options.port).to.equal(8080);
      expect(nexus.options.timeout).to.equal(25000);
      nexus.timeout(500000);
      expect(nexus.options.timeout).to.equal(500000);
  });
});

var post = new (require('./nexpress/lib/post.js'))();
//TODO: Create test that sets up a post http server we can talk to

var get = new (require('./nexpress/lib/get.js'))();

describe('HTTP Method callables', function() {
    it('should have the following', function() {
        var http = nexus.http();
        expect(http).to.exist;
        expect(http.listen).to.exist;
        expect(http.favicon).to.exist;
        expect(http.staticDir).to.exist;
        expect(http.ssi).to.exist;
        expect(http.post).to.exist;
        expect(http.get).to.exist;
        expect(http.get.go).to.exist; // ensure object has method
        expect(http.get.go).to.be.a('function');
    });
});

describe('Custom Option Set', function() {
    it('should detect change in options', function() {
        expect(nexus.options).to.exist;
        expect(nexus.options.port).to.equal(8080);
        nexus.port(3000);
        expect(nexus.options.port).to.equal(3000);
        expect(nexus.options.timeout).to.equal(500000); // See first setting
        nexus.timeout(30000);
        expect(nexus.options.timeout).to.equal(30000);
    });
});

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

describe('HTTPS server', function() {
    it('should be instantiable', function() {
        expect(nexus.https).to.exist;
        expect(nexus.https).to.be.a('function');
    });
});


var tag = require('./nexpress/lib/tagparse.js');
describe('HTML webpage tagging', function() {
   it('should change code between tags', function() {
       expect(get.tagger).to.exist;
       expect(get.tagmod).to.exist;
       expect(tag.parseList).to.exist;
       expect(tag.parseData).to.exist;
       get.tagger(tag);
       var testdata = '<html><head></head><body>{{ "hello" }} {{ "world" }} {{console.log}}</body></html>';
       tag.parseData(null, testdata, {'console.log': Function.create(null, function() { console.log("Hello World, This is Function"); return "Finished"; })});
       
   });
});