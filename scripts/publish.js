
var secrets = require('./secrets.json')
var fs = require('fs')
var package_ = require('../package')


var knox = require('knox').createClient({
    key: secrets.S3_KEY,
    secret: secrets.S3_SECRET,
    bucket: secrets.S3_BUCKET
});



function put_files(files, local_path, remote_path, content_type) {
  var total = files.length;
  var uploaded = 0;
  for(var i in  files) {
    var file = files[i];
    console.log(local_path + '/' + file, ' => ', remote_path + '/' + file);
    var content_type = {
      'png': 'image/png',
      'gif': 'image/gif',
      'css': 'text/css',
      'js': 'application/x-javascript'
    }
    var ext = file.split('.');
    ext = ext[ext.length - 1];
    knox.putFile(local_path + '/' + file, remote_path + '/' + file, {'Content-Type': content_type[ext], 'x-amz-acl': 'public-read' }, function(err, result) {
      if(!err) {
        if (200 == result.statusCode) { 
          uploaded++
        }
      }
      else { 
          console.log('Failed to upload file to Amazon S3', err); 
      }
      total--;
      if(total == 0) {
        if(uploaded == files.length) {
          console.log("files uploaded");
        } else {
          console.log("an error ocurred");
        }
      }

    });
  }
}


var JS_FILES = [
  'cartodb.js',
  'cartodb.uncompressed.js'
]

var CSS_FILES = [
  'cartodb.css',
  'cartodb.ie.css'
]

var IMG_FILES = fs.readdirSync('themes/img')

put_files(JS_FILES, 'v2', 'cartodb.js/v2')
put_files(CSS_FILES, 'v2/themes/css', 'cartodb.js/v2/themes/css')
put_files(IMG_FILES, 'v2/themes/img', 'cartodb.js/v2/themes/img')

put_files(JS_FILES, 'v2', 'cartodb.js/v2/' + package_.version)
put_files(CSS_FILES, 'v2/themes/css', 'cartodb.js/v2/' + package_.version + '/themes/css')
put_files(IMG_FILES, 'v2/themes/img', 'cartodb.js/v2/' + package_.version + '/themes/img')
