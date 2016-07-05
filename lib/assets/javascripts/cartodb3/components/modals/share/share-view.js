var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var ShareItemView = require('./share-item-view');
var HeaderView = require('./header/header-view');
var FooterView = require('./footer/footer-view');
var InfoView = require('./info/info-view');
var template = require('./share.tpl');
var templateError = require('./share-error.tpl');

module.exports = CoreView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-back': '_onBack'
  },

  initialize: function (opts) {
    if (!opts.collection) throw new Error('collection is required');
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.configModel) throw new TypeError('configModel is required');
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');
    if (!opts.userModel) throw new TypeError('userModel is required');

    this._mapcapsCollection = opts.mapcapsCollection;
    this._modalModel = opts.modalModel;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;

    this._stateModel = new Backbone.Model({
      status: 'show'
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    if (this._hasError()) {
      this._renderError();
    } else {
      this._initViews();
    }
  },

  _initBinds: function () {
    this._stateModel.on('change:status', this.render, this);
    this.add_related_model(this._stateModel);
  },

  _hasError: function () {
    return this._stateModel.get('status') === 'error';
  },

  _isLoading: function () {
    return this._stateModel.get('status') === 'loading';
  },

  _renderError: function () {
    this.$el.html(templateError());
  },

  _initViews: function () {
    var renderItemView = this._renderItemView.bind(this);

    this.$el.html(template());
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
      onUpdate: self._onUpdate.bind(self),
      isUpdated: self._stateModel.get('status') === 'updated'
    });
    this.$('.js-footer').append(view.render().el);
    this.addView(view);
  },

  _headerView: function () {
    var self = this;
    var view = new HeaderView({
      userModel: self._userModel,
      mapcapsCollection: self._mapcapsCollection,
      visDefinitionModel: self._visDefinitionModel
    });
    this.$('.js-header').append(view.render().el);
    this.addView(view);
  },

  _infoView: function () {
    var self = this;
    var view = new InfoView({
      visDefinitionModel: self._visDefinitionModel,
      mapcapsCollection: self._mapcapsCollection,
      loading: this._isLoading()
    });
    this.$('.js-info').append(view.render().el);
    this.addView(view);
  },

  _onContinue: function () {
    this._modalModel.destroy();
  },

  _onBack: function () {
    this._stateModel.set({status: 'show'});
  },

  _onUpdate: function () {
    var self = this;
    var url = this._visDefinitionModel.mapcapsURL();
    var data = {
      api_key: this._configModel.get('api_key'),
      state_json: window.dashboard.getState()
    };

    self._stateModel.set({status: 'loading'});

    $.post(url, data)
    .done(function (data) {
      self._mapcapsCollection.add(data, {at: 0});
      self._stateModel.set({status: 'updated'});
    })
    .fail(function () {
      self._stateModel.set({status: 'error'});
    });
  },

  _onChangePrivacy: function () {
    this.options.onChangePrivacy && this.options.onChangePrivacy();
  }
});
