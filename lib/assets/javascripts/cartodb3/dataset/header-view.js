var CoreView = require('backbone/core-view');
var template = require('./header.tpl');
var moment = require('moment');
var titleSuffix = ' | CartoDB';

var PRIVACY_MAP = {
  public: 'is-green',
  link: 'is-orange',
  password: '',
  private: 'is-red'
};

module.exports = CoreView.extend({

  className: 'Editor-HeaderInfoEditor',

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.visModel) throw new Error('visModel is required');
    if (!opts.syncModel) throw new Error('syncModel is required');

    this._tableModel = opts.tableModel;
    this._modals = opts.modals;
    this._syncModel = opts.syncModel;
    this._visModel = opts.visModel;

    this._setDocumentTitle();
    this._initBinds();
  },

  render: function () {
    var privacy = this._visModel.get('privacy');
    this.$el.html(
      template({
        title: this._tableModel.get('name'),
        privacy: privacy,
        cssClass: PRIVACY_MAP[privacy.toLowerCase()],
        ago: moment(this._tableModel.get('updated_at')).fromNow()
      })
    );
    return this;
  },

  _initBinds: function () {
    this._tableModel.bind('change', this.render, this);
    this._tableModel.bind('change:name', this._onChangeName, this);
    this._visModel.bind('change', this.render, this);
    this.add_related_model(this._tableModel);
    this.add_related_model(this._visModel);
  },

  _onChangeName: function () {
    this._setDocumentTitle();
    this._visModel.set('name', this._tableModel.get('name'), { silent: true });
  },

  _setDocumentTitle: function () {
    document.title = this._tableModel.get('name') + titleSuffix;
  }

});
