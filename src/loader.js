
;(function() {

  function defined(v) { return typeof(v) !== 'undefined'; }

  var deps = [
    [window.jQuery, 'jquery.min.js'],
    [window._, 'underscore-min.js'],
    [window.Backbone, 'backbone.js'],
    [window.Mustache, 'mustache.js'],
    [window.L, 'leaflet.js']
  ];

  var toLoad = [];

  function load(s) {
    toLoad.push('../dist/' + s);
  }

  for(var i = 0; i < deps.length; ++i) {
    var dep = deps[i];
    if(!defined(dep[0])) {
      load(dep[1]);
    }
  }

  if(!defined(window.wax)) {
    load('wax.leaf.js')
  }

  if(defined(window.google) && defined(window.google.maps) && !defined(window.wax)) {
    load('wax.g.js');
  }

  load('cartodb.js')

  head.js.apply(head, toLoad);

})();
