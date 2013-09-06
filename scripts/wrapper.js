// cartodb.js version: <%= version %>
// uncompressed version: cartodb.uncompressed.js
// sha: <%= sha %>
(function() {
  var root = this;

  if(!<%= load_jquery %>) {
    if(root.jQuery === undefined) {
      throw "jQuery should be loaded before include cartodb.js";
    }
  }

  // save current libraries
  var __prev = {
    jQuery: root.jQuery,
    $: root.$,
    L: root.L,
    Mustache: root.Mustache,
    Backbone: root.Backbone,
    _: root._
  };


  <%=CDB_DEPS%>




  // mustache does no defined a global var, defines a var Mustache instead
  // so add it to root
  root.Mustache = Mustache;
  (function() {
    var $ = root.$;
    var jQuery = root.jQuery;
    var L = root.L;
    var Mustache = root.Mustache;
    var Backbone = root.Backbone;
    var _ = root._;


    <%=CDB_LIB%>

    cdb.$ = $;
    cdb.L = L;
    cdb.Mustache = Mustache;
    cdb.Backbone = Backbone;
    cdb._ = _;

  })();




  ;
  for(var i in __prev) {
    // keep it at global context if it didn't exist
    if(__prev[i]) {
      window[i] = __prev[i];
    }
  }


})();
