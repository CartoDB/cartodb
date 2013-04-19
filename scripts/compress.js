
fs = require('fs')
var _exec = require('child_process').exec;
var package_ = require('../package')
var _ = require('underscore');

INCLUDE_DEPS = false;
if(process.argv.length >= 3) {
  INCLUDE_DEPS = process.argv[2] === 'include_deps'
}

require('../src/cartodb');

cdb.files.splice(0, 0, 'cartodb.js');
var files = cdb.files;

var c = 0;
cmds = [
  'rm -rf  dist/_cartodb.js',
  "echo // cartodb.js v" + package_.version + " >> dist/_cartodb.js",
  "echo // uncompressed version: cartodb.uncompressed.js >> dist/_cartodb.js"
];


function concat_files(_files, ignore, callback) {
  var files = _.clone(_files);
  var all = '';
  var _r = function(f) {
    if(_.contains(ignore, f)) {
      var next = files.shift();
      if(next) _r(next);
      else callback(all);
      console.log(f, "..... IGNORED");
    } else {
      console.log(f);
      fs.readFile(f, 'utf8', function (err, data) {
        if (err) { throw new Error(err); }
        all += data;
        var next = files.shift();
        if(next) _r(next);
        else callback(all);
      });
    }
  }
  _r(files.shift());
}

var vendor_files = [];
var cdb_files = [];
for(var i = 0; i < files.length; ++i) {
  var f = files[i];
  if(f.indexOf('vendor') === -1) {
    cdb_files.push('./src/' + f);
  } else {
    vendor_files.push('./vendor/' + f.split('/')[2]);
  }
}

require('git-rev').long(function (sha) {
  concat_files(vendor_files, [], function(vendor_js) {
    concat_files(cdb_files, [], function(cdb_js) {
      fs.readFile('scripts/wrapper.js', 'utf8', function (err, final_js) {
        fs.writeFile("dist/_cartodb.js", _.template(final_js)({
          CDB_DEPS: vendor_js,
          CDB_LIB: cdb_js,
          version: package_.version,
          sha: sha,
          load_jquery: true
        }));
      });
    });
  });
});

//no jquery
require('git-rev').long(function (sha) {
  concat_files(vendor_files, ['./vendor/jquery.min.js'], function(vendor_js) {
    concat_files(cdb_files, [], function(cdb_js) {
      fs.readFile('scripts/wrapper.js', 'utf8', function (err, final_js) {
        fs.writeFile("dist/_cartodb_nojquery.js", _.template(final_js)({
          CDB_DEPS: vendor_js,
          CDB_LIB: cdb_js,
          version: package_.version,
          sha: sha,
          load_jquery: false
        }));
      });
    });
  });
});



//exec batch commands

function batch() {
  var cmd = cmds.shift();
  if(cmd !== undefined) {
    _exec(cmd, batch);
  }
}

batch();



