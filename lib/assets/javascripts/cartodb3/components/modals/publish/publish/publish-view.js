var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CreateShareOptions = require('./create-share-options');
var ShareCollection = require('./share-collection');
var ShareItemView = require('./share-item-view');
var template = require('./publish.tpl');

var REQUIRED_OPTS = [
  'visDefinitionModel',
  'mapcapsCollection',
  'userModel'
];

module.exports = CoreView.extend({
  className: 'Publish-modalShare u-inner',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this.hasOrganization = this._userModel.isInsideOrg();

    var shareOptions = CreateShareOptions(this._visDefinitionModel);
    this._shareCollection = new ShareCollection(shareOptions);

    this._initBinds();
  },

  render: function () {
    var isPublished = this._mapcapsCollection.length > 0;
    this.clearSubViews();
    this.$el.html(template({
      isPublished: isPublished
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
    var isPublished = this._mapcapsCollection.length > 0;
    var view = new ShareItemView({
      model: model,
      isPublished: isPublished,
      hasOrganization: self.hasOrganization
    });

    this.$('.js-list').append(view.render().el);
    this.addView(view);
  },

  _revampPrivacyOptions: function () {
    var shareOptions = CreateShareOptions(this._visDefinitionModel);
    this._shareCollection.reset(shareOptions);
  },

  _initBinds: function () {
    this._visDefinitionModel.on('sync', this._revampPrivacyOptions, this);
    this.add_related_model(this._visDefinitionModel);

    this._shareCollection.on('reset', this.render, this);
    this.add_related_model(this._shareCollection);

    this._mapcapsCollection.on('reset add', this.render, this);
    this.add_related_model(this._mapcapsCollection);
  }
});
