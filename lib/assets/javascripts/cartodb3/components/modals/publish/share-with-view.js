var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./share-with.tpl');

var REQUIRED_OPTS = [
  'visDefinitionModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._displayBig = opts.displayBig || false;
    this._acl = this._visDefinitionModel._permissionModel.acl;

    this._initBinds();
  },

  render: function () {
    var people = this._acl.length;
    this.clearSubViews();
    this.$el.html(template({
      people: people,
      displayBig: this._displayBig
    }));
    return this;
  },

  _initBinds: function () {
    this._acl.on('reset', this.render, this);
    this.add_related_model(this._acl);
  }
});
