module.exports = require('./nexpress/nexpress.js');
var request = require('superagent');
var expect = require('expect.js');

var nexus = require('./nexpress/nexpress.js')();

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