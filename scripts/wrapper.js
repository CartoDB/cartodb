
(function() {
  var root = this;

  // save current libraryes
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
    var L = root.L;
    var Mustache = root.Mustache;
    var Backbone = root.Backbone;
    var _ = root._;


    <%=CDB_LIB%>

  })();




  ;
  for(var i in __prev) {
    window[i] = __prev[i];
  }


})();
