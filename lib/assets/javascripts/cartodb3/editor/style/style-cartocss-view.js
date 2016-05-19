  var cdb = require('cartodb.js');
var CodeMirrorView = require('../../components/code-mirror/code-mirror-view');

module.exports = cdb.core.View.extend({

  className: 'Editor-styleContentCartoCSS',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._styleModel = this._layerDefinitionModel.styleModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._layerDefinitionModel.bind('change:cartocss', this._updateEditorContent, this);
    this.add_related_model(this._layerDefinitionModel);
  },

  _initViews: function () {
    this.codeMirrorView = new CodeMirrorView({
      model: new cdb.core.Model({
        content: this._layerDefinitionModel.get('cartocss')
      })
    });
    this.addView(this.codeMirrorView);
    this.$el.append(this.codeMirrorView.render().el);
  },

  _updateEditorContent: function () {
    this.codeMirrorView.setContent(this._layerDefinitionModel.get('cartocss'));
  }

});
