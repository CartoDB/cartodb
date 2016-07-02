var CoreView = require('backbone/core-view');
var template = require('./footer.tpl');

var PRIVACY_MAP = {
  public: 'is-green',
  link: 'is-orange',
  password: '',
  private: 'is-red'
};

module.exports = CoreView.extend({
  events: {
    'click .js-save': '_save'
  },

  initialize: function (opts) {
    if (!opts.visMetadataModel) throw new Error('visMetadataModel is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.onSaveAction) throw new Error('onSaveAction is required');

    this._visMetadataModel = opts.visMetadataModel;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._onSaveAction = opts.onSaveAction;
    this._initBinds();
  },

  _initBinds: function () {
    this._visMetadataModel.on('change', this.render, this);
  },

  render: function () {
    var privacy = this._visDefinitionModel.get('privacy');

    this.$el.html(
      template({
        canFinish: this._visMetadataModel.isValid(),
        cssClass: PRIVACY_MAP[privacy.toLowerCase()],
        privacy: privacy
      })
    );
    return this;
  },

  _save: function () {
    this._visMetadataModel.isValid() && this._onSaveAction();
  }

});
