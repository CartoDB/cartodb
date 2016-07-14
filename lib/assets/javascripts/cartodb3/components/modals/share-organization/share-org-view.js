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
    'click .js-back': '_onBack'
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
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;

    this._searchPaginationView = new SearchPaginationView({
      className: 'Share-inner',
      listCollection: this._grantablesCollection,
      createContentView: function () {
        return new ListView({
          collection: self._grantablesCollection,
          currentUserId: self._currentUserId,
          visDefinitionModel: self._visDefinitionModel,
          hasOrganization: true // q param
        });
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
  }
});
