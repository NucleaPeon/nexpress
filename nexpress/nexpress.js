exports = module.exports = nexus;

var http = require('http');
function nexus() {
  var server = function() {
    return http.createServer(function (req, res) { console.log("Hello World"); });
  }
  //return http.createServer(function (req, res) {
  //  console.log("Nexus Started");
  //});
  console.log('Server running at http://localhost:3000/');
} 


