var $ = require('jquery');
var CoreView = require('backbone/core-view');
var ShareItemView = require('./share-item-view');
var HeaderView = require('./header/header-view');
var FooterView = require('./footer/footer-view');
var InfoView = require('./info/info-view');
var template = require('./share.tpl');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-continue': '_onContinue'
  },

  initialize: function (opts) {
    if (!opts.collection) throw new Error('collection is required');
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.configModel) throw new TypeError('configModel is required');
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');
    if (!opts.userModel) throw new TypeError('userModel is required');

    this._modalModel = opts.modalModel;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
  },

  _initViews: function () {
    var renderItemView = this._renderItemView.bind(this);

    this._headerView();
    this.collection.each(renderItemView);
    this._infoView();
    this._footerView();
  },

  _renderItemView: function (model) {
    var self = this;
    var view = new ShareItemView({
      model: model,
      onChangePrivacy: self._onChangePrivacy.bind(this)
    });

    this.$('.js-list').append(view.render().el);
    this.addView(view);
  },

  _footerView: function () {
    var self = this;
    var view = new FooterView({
      onDone: self._onContinue.bind(self),
      onUpdate: self._onUpdate.bind(self)
    });
    this.$('.js-footer').append(view.render().el);
    this.addView(view);
  },

  _headerView: function () {
    var self = this;
    var view = new HeaderView({
      userModel: self._userModel,
      visDefinitionModel: self._visDefinitionModel
    });
    this.$('.js-header').append(view.render().el);
    this.addView(view);
  },

  _infoView: function () {
    var self = this;
    var view = new InfoView({
      visDefinitionModel: self._visDefinitionModel
    });
    this.$('.js-info').append(view.render().el);
    this.addView(view);
  },

  _onContinue: function () {
    this._modalModel.destroy();
  },

  _onUpdate: function () {
    var url = this._visDefinitionModel.mapcapsURL();
    var data = {
      api_key: this._configModel.get('api_key')
    };

    $.post(url, data)
    .done(function () {
      console.log('mapcaps created!');
    })
    .fail(function () {
      console.log('mapcaps failed!');
    });
  },

  _onChangePrivacy: function () {
    this.options.onChangePrivacy && this.options.onChangePrivacy();
  }
});
