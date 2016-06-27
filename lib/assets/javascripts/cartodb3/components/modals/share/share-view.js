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
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');
    if (!opts.userModel) throw new TypeError('userModel is required');

    this._modalModel = opts.modalModel;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._userModel = opts.userModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
  },

  _initViews: function () {
    this._headerView();
    this._getLinkView();
    this._embedView();
    this._cartodbjsView();
    this._mobileView();
    this._infoView();
    this._footerView();
  },

  _getLinkView: function () {
    var self = this;
    var view = new ShareItemView({
      icon: 'Share-getIcon',
      type: 'get-link',
      content: self._visDefinitionModel.embedURL()
    });
    this.$('.js-list').append(view.render().el);
    this.addView(view);
  },

  _embedView: function () {
    var view = new ShareItemView({
      icon: 'Share-embedIcon',
      type: 'embed',
      content: '<iframe width="100%" height="520" frameborder="0" src="https://team.cartodb.com/u/butilon/viz/7834513e-39ed-11e6-8844-0e674067d321/embed_map" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>',
      url: '#'
    });
    this.$('.js-list').append(view.render().el);
    this.addView(view);
  },

  _cartodbjsView: function () {
    var view = new ShareItemView({
      icon: 'Share-cartodbIcon',
      type: 'cartodbjs',
      content: 'https://team.cartodb.com/u/butilon/api/v2/viz/7834513e-39ed-11e6-8844-0e674067d321/viz.json',
      url: 'https://docs.carto.com/cartodb-platform/cartodb-js/'
    });
    this.$('.js-list').append(view.render().el);
    this.addView(view);
  },

  _mobileView: function () {
    var view = new ShareItemView({
      icon: 'Share-mobileIcon',
      type: 'mobile-sdk',
      content: 'mapView.loadCartoDB("butilon", "7834513e-39ed-11e6-8844-0e674067d321")',
      url: '#'
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
    console.log('update');
  }
});
