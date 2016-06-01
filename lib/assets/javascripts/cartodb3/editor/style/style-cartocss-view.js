var cdb = require('cartodb.js');
var CodeMirrorView = require('../../editor/components/code-mirror/code-mirror-view');

module.exports = cdb.core.View.extend({

  className: 'Editor-styleContentCartoCSS Editor-content',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');
    if (!opts.codemirrorModel) throw new Error('codemirrorModel is required');
    if (!opts.onApplyEvent) throw new Error('onApplyEvent');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._styleModel = this._layerDefinitionModel.styleModel;
    this._codemirrorModel = opts.codemirrorModel;

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
      model: this._codemirrorModel
    });
    this.codeMirrorView.bind('codeSaved', this._triggerCodeSaved, this);
    this.addView(this.codeMirrorView);
    this.$el.append(this.codeMirrorView.render().el);
  },

  _updateEditorContent: function () {
    this.codeMirrorView.setContent(this._layerDefinitionModel.get('cartocss'));
  },

  _triggerCodeSaved: function (code, view) {
    this.options.onApplyEvent && this.options.onApplyEvent();
  }

});
