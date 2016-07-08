var CoreView = require('backbone/core-view');
var CodeMirrorView = require('../../../../components/code-mirror/code-mirror-view');
var ErrorTemplate = require('./code-mirror-error.tpl');

module.exports = CoreView.extend({

  className: 'Editor-content',

  initialize: function (opts) {
    if (!opts.codemirrorModel) throw new Error('codemirrorModel is required');
    if (!opts.onApplyEvent) throw new Error('onApplyEvent');

    this._codemirrorModel = opts.codemirrorModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.codeMirrorView = new CodeMirrorView({
      model: this._codemirrorModel,
      tip: _t('editor.infowindow.code-mirror.save'),
      errorTemplate: ErrorTemplate
    });

    this.codeMirrorView.bind('codeSaved', this._triggerCodeSaved, this);
    this.addView(this.codeMirrorView);
    this.$el.append(this.codeMirrorView.render().el);
  },

  _triggerCodeSaved: function (code, view) {
    this.options.onApplyEvent && this.options.onApplyEvent();
  }

});
