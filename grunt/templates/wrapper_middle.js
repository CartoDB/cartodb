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
