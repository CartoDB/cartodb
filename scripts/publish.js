
var secrets = require('../secrets.json');
var fs = require('fs');
var http = require('http');
var package_ = require('../package');
var _exec = require('child_process').exec;
var AWS = require('aws-sdk');

//
// contants
// 

var S3_BUCKET_URL = 'libs.cartocdn.com.s3.amazonaws.com';

var JS_FILES = [
  'cartodb.js',
  'cartodb.uncompressed.js',
  'cartodb.core.js',
  'cartodb.core.uncompressed.js',
  'cartodb.nojquery.js',
  'cartodb.mod.torque.js',
  'cartodb.mod.torque.uncompressed.js',
  'cartodb.noleaflet.js'
]

var CSS_FILES = [
  'cartodb.css',
  'cartodb.ie.css'
]

var CSS_IMAGE_FILES = fs.readdirSync('themes/css/images')
var IMG_FILES = fs.readdirSync('themes/img')

var content_type = {
  'png': 'image/png',
  'gif': 'image/gif',
  'css': 'text/css',
  'js': 'application/x-javascript'
};


AWS.config.update({ accessKeyId: secrets.S3_KEY, secretAccessKey: secrets.S3_SECRET });
var s3 = new AWS.S3({params: {Bucket: secrets.S3_BUCKET}});


//
// global flags
//

var only_invalidate = process.argv.length > 2 && process.argv[2] == '--invalidate';
var only_current_version = process.argv.length > 2 && process.argv[2] == '--current_version';
var version = 'v' + package_.version.split('.')[0];

/**
 * check that the remote file is the same than local one to avoid errors
 */
function check_file_upload(local, remote, done) {
  var fs = require('fs');
  var file = fs.createWriteStream();
  var request = http.get("http://im.glogster.com/media/2/5/24/10/5241033.png", function(response) {
    response.pipe(file);
    done && done();
  });
}

function put_file(local_path, remote_path, file, errors, done) {
    var local_file = file;

    // extract extension
    var ext = file.split('.');
    ext = ext[ext.length - 1];

    var headers = { 'Content-Type': content_type[ext] };

    // define the function that actually puts the tile is S3
    var _put = function() {
      var local = local_path + '/' + local_file;
      var remote = remote_path + '/' + file;

      // dont need to update content length, knox do it
      var size = fs.statSync(local).size;

      fs.readFile(local, function (err, data) {
        var opts = {
          Key: remote,
          Body: data,
          ACL:'public-read',
          ContentType: headers['Content-Type'],
          ContentLength: size
        };
        if(headers['Content-Encoding']) {
          opts.ContentEncoding = headers['Content-Encoding'];
        }
        // send file to S3
        s3.client.putObject(opts, function (err, data) {
          console.log("===>", file);
          if(err || !data) {
            errors.push(file + ' Failed to upload file to Amazon S3', err);
            console.log('Failed to upload file to Amazon S3', err); 
          }
          console.log( local, ' => ', remote, size, "bytes");
          done && done();
        });
      });
    }

    // compress depending on the extension
    if(ext === 'js' || ext === 'css') {
      _exec('gzip -c -9 ' + local_path + '/' + file + ' > ' + local_path + '/' + file + '.gz', function(err) {
        if(err) {
          console.log("there was an error compressing file");
        }
        local_file = file + '.gz';
        headers['Content-Encoding'] = 'gzip';
        _put();
      });
    } else {
      _put();
    }




}

function put_files(files, local_path, remote_path, content_type, done) {
  var total = files.length;
  var errors = [];
  for(var i in  files) {
    var file = files[i];
    put_file(local_path, remote_path, file, errors, function() {
      total--;
      if(total === 0) {
        console.log("FINISHED");
        done && done(errors);
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



/**
 * invalidates faslty files.
 * this function invalidates all the files, including
 * previous or development versions but it shouldn't be a 
 * big deal and it simplifies a lot the task
 */
function invalidate_fastly() {
  var cmd = "curl -H 'Fastly-Key: " + secrets.FASTLY_API_KEY + "' -X POST 'https://api.fastly.com/service/" + secrets.FASTLY_CARTODB_SERVICE +"/purge_all'";
  console.log(cmd);
  _exec(cmd, function (error, stdout, stderr) {
    var status = '';
    try {
      status = JSON.parse(stdout).status;
    } catch(e) {
    }
    if (!error && status === 'ok') {
      console.log(" *** faslty invalidated")
    } else {
      console.log(" *** faslty invalidated FAIL", error, stdout);
    }
  });
}

function invalidate_cdn() {
  invalidate_fastly();
  return;
  // invalidate cloudfront
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
}


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

invalidate_cdn();


