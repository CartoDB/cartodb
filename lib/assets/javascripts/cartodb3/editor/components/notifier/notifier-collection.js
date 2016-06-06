var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  model: function (view) {
    var d = {};
    d.cid = view.cid;
    d.view = view;
    return new Backbone.Model(d);
  },

  search: function (id) {
    return this.findWhere({cid: id});
  },

  remove: function (view) {
    var model = this.search(view.cid);
    return Backbone.Collection.prototype.remove.call(this, model);
  }
});
