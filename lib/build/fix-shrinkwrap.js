var fs = require('fs');
var file = 'npm-shrinkwrap.json';
fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/http:\/\/registry.npmjs.org/g, 'https://registry.npmjs.org');

  fs.writeFile(file, result, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
  });
});
