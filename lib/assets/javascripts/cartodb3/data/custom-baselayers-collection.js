var Backbone = require('backbone');
var CustomBaselayerModel = require('./custom-baselayer-model');

module.exports = Backbone.Collection.extend({

  model: function (d, opts) {
    var self = opts.collection;

    var m = new CustomBaselayerModel(d, {
      parse: true,
      collection: self
    });

    return m;
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.currentUserId) throw new Error('currentUserId is required');

    this._configModel = opts.configModel;
    this._currentUserId = opts.currentUserId;
  },

  getSelected: function () {
    return this.findWhere({ selected: true });
  },

  updateSelected: function (id) {
    var oldSelected = this.getSelected();
    oldSelected && oldSelected.save({ selected: false });

    var newSelected = this.get(id);

    if (newSelected) {
      if (oldSelected && oldSelected.get('className') === newSelected.get('className')) return;

      newSelected.save({ selected: true });
    }
  }

});
