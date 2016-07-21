var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./share-org.tpl');
var GrantableCollection = require('../../../data/grantables-collection');
var SearchPaginationView = require('../../../components/pagination-search/pagination-search-view');
var ListView = require('./share-list-view');

var REQUIRED_OPTS = [
  'modalModel',
  'onBack',
  'configModel',
  'currentUserId',
  'organization',
  'visDefinitionModel'
];

module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-cancel': '_onCancel',
    'click .js-back': '_onBack',
    'click .js-save': '_onSave'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._grantablesCollection = new GrantableCollection([], {
      currentUserId: this._currentUserId,
      organization: this._organization,
      configModel: this._configModel
    });

    this._sharePermissionModel = this._visDefinitionModel.getPermissionModel().clone();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      name: this._visDefinitionModel.get('name')
    }));
    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;

    this._searchPaginationView = new SearchPaginationView({
      className: 'u-inner',
      listCollection: this._grantablesCollection,
      createContentView: function (opts) {
        return new ListView(_.extend({}, opts, {
          collection: self._grantablesCollection,
          currentUserId: self._currentUserId,
          sharePermissionModel: self._sharePermissionModel,
          organization: self._organization,
          isVisualization: self._visDefinitionModel.isVisualization()
        }));
      }
    });
    this.addView(this._searchPaginationView);
    this.$('.js-body').html(this._searchPaginationView.render().el);
  },

  _onCancel: function () {
    this._modalModel.destroy();
  },

  _onBack: function () {
    this._modalModel.destroy();
    this._onBack();
  },

  _onSave: function () {
    var permission = this._visDefinitionModel.getPermissionModel();
    permission.overwriteAcl(this._sharePermissionModel);
    this._searchPaginationView.showLoading();
    permission.save()
      .fail(this._searchPaginationView.showError.bind(this._searchPaginationView))
      .done(this._onBack.bind(this));
  }
});
