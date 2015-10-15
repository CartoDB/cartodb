module.exports = {
  extend: function(obj, prop) {
    for(var p in prop) { obj[p] = prop[p]; }
    return obj;
  },
  defaults: function(obj, def) {
    for(var p in def) {
      if(obj[p] == undefined) {
        obj[p] = def[p];
      }
    }
    return obj;
  },
  isFunction: function(fn) {
    return typeof(fn) === 'function';
  }
}
