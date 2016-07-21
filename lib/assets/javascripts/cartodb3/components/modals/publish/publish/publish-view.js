var _ = require('underscore');
var CoreView = require('backbone/core-view');
var ShareItemView = require('../../share/share-item-view');
var template = require('./publish.tpl');

var REQUIRED_OPTS = [
  'shareCollection',
  'visDefinitionModel',
  'mapcapsCollection'
];

module.exports = CoreView.extend({
  className: 'Publish-modalShare u-inner',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this.isPublished = this._mapcapsCollection.length > 0;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      isPublished: this.isPublished
    }));
    this._initViews();
    return this;
  },

  _initViews: function () {
    var renderItemView = this._renderItemView.bind(this);
    this._shareCollection.each(renderItemView);
  },

  _renderItemView: function (model) {
    var self = this;
    var view = new ShareItemView({
      model: model,
      isPublished: self.isPublished
    });

    this.$('.js-list').append(view.render().el);
    this.addView(view);
  },

  _initBinds: function () {
    this._visDefinitionModel.on('change:privacy', this.render, this);
  }
});
