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

    });
});
