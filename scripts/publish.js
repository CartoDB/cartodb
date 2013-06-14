
var secrets = require('../secrets.json')
var fs = require('fs')
var package_ = require('../package')
var _exec = require('child_process').exec;


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
    var content_type = {
      'png': 'image/png',
      'gif': 'image/gif',
      'css': 'text/css',
      'js': 'application/x-javascript'
    }
    var ext = file.split('.');
    ext = ext[ext.length - 1];
    var local_file = file
    var headers = { 'Content-Type': content_type[ext], 'x-amz-acl': 'public-read' };
    if(ext == 'js' || ext == 'css') {
      _exec('gzip -c -9 ' + local_path + '/' + file + ' > ' + local_path + '/' + file + '.gz');
      local_file = file + '.gz'
      headers['Content-Encoding'] = 'gzip';
    }
    console.log(local_path + '/' + local_file, ' => ', remote_path + '/' + file);
    knox.putFile(local_path + '/' + local_file, remote_path + '/' + file, headers , function(err, result) {
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

function invalidate_files(files, remote_path) {
  var total = files.length;
  var uploaded = 0;
  var to_invalidate = files.map(function(f) {
    return remote_path + '/' + f;
  });

  for(var i in to_invalidate) {
    var cmd = 'ruby ./scripts/cdn_invalidation.rb ' + to_invalidate[i];
    _exec(cmd, function (error, stdout, stderr){
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if(error) console.log(error);
    });
    console.log(cmd);
  }
}


var JS_FILES = [
  'cartodb.js',
  'cartodb.uncompressed.js',
  'cartodb.nojquery.js'
]

var CSS_FILES = [
  'cartodb.css',
  'cartodb.ie.css'
]

var CSS_IMAGE_FILES = fs.readdirSync('themes/css/images')

var IMG_FILES = fs.readdirSync('themes/img')

var only_invalidate = process.argv.length > 2 && process.argv[2] == '--invalidate';
var only_current_version = process.argv.length > 2 && process.argv[2] == '--current_version';

var version = 'v' + package_.version.split('.')[0]

if(!only_invalidate) {
  if(!only_current_version) {
    put_files(JS_FILES, '' + version + '', 'cartodb.js/' + version + '')
    put_files(CSS_FILES, '' + version + '/themes/css', 'cartodb.js/' + version + '/themes/css')
    put_files(CSS_IMAGE_FILES, '' + version + '/themes/css/images', 'cartodb.js/' + version + '/themes/css/images')
    put_files(IMG_FILES, '' + version + '/themes/img', 'cartodb.js/' + version + '/themes/img')
  }

  put_files(JS_FILES, '' + version + '', 'cartodb.js/' + version + '/' + package_.version)
  put_files(CSS_FILES, '' + version + '/themes/css', 'cartodb.js/' + version + '/' + package_.version + '/themes/css')
  put_files(CSS_IMAGE_FILES, '' + version + '/themes/css/images', 'cartodb.js/' + version + '/' + package_.version + '/themes/css/images')
  put_files(IMG_FILES, '' + version + '/themes/img', 'cartodb.js/' + version + '/' + package_.version + '/themes/img')
}


console.log(" *** flushing cdn cache")
if(!only_current_version) {
  invalidate_files(JS_FILES,  'cartodb.js/' + version + '')
  invalidate_files(CSS_FILES, 'cartodb.js/' + version + '/themes/css')
  invalidate_files(CSS_IMAGE_FILES, 'cartodb.js/' + version + '/themes/css/images')
  invalidate_files(IMG_FILES, 'cartodb.js/' + version + '/themes/img')
}
invalidate_files(JS_FILES , 'cartodb.js/' + version + '/' + package_.version)
invalidate_files(CSS_FILES, 'cartodb.js/' + version + '/' + package_.version + '/themes/css')
invalidate_files(CSS_IMAGE_FILES, 'cartodb.js/' + version + '/' + package_.version + '/themes/css/images')
invalidate_files(IMG_FILES, 'cartodb.js/' + version + '/' + package_.version + '/themes/img')
