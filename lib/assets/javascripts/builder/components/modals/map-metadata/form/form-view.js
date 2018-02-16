var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var templateForm = require('./form.tpl');
require('builder/components/form-components/index');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var utils = require('builder/helpers/utils');

var REQUIRED_OPTS = [
  'visDefinitionModel',
  'visMetadataModel'
];

module.exports = CoreView.extend({
  className: 'Metadata-form',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(templateForm());
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._addInputView();
    this._addTextareaView();
    this._addTagsView();
    this._addTooltip();
  },

  _addInputView: function () {
    this._inputView = new Backbone.Form.editors.Text({
      key: 'name',
      model: this._visMetadataModel,
      schema: {
        options: this._visDefinitionModel.get('name'),
        editorAttrs: {
          placeholder: _t('components.modals.maps-metadata.form.name-placeholder')
        }
      }
    });
    this._inputView.on('change', this._commitView, this);

    this.$('.js-name-field').append(this._inputView.render().$el);
  },

  _addTextareaView: function () {
    this._textareaView = new Backbone.Form.editors.TextArea({
      className: 'CDB-Textarea Metadata-textarea',
      key: 'description',
      model: this._visMetadataModel,
      schema: {
        options: this._visDefinitionModel.get('description'),
        editorAttrs: {
          placeholder: _t('components.modals.maps-metadata.form.description-placeholder')
        }
      }
    });

    this._textareaView.on('change', this._commitView, this);

    this.$('.js-description-field').append(this._textareaView.render().$el);
  },

  _addTagsView: function () {
    this._taglistView = new Backbone.Form.editors.Taglist({
      key: 'tags',
      model: this._visMetadataModel,
      schema: {
        options: {
          tags: this._visDefinitionModel.get('tags') || []
        }
      }
    });

    this._taglistView.on('change', this._commitView, this);

    this.$('.js-tags-field').append(this._taglistView.render().$el);
    this.addView(this._taglistView);
  },

  _addTooltip: function () {
    var title = this.$('.js-markdown').data('tooltip');
    this._removeTooltip();

    this._tooltip = new TipsyTooltipView({
      el: this.$('.js-markdown'),
      html: true,
      title: function () {
        return title;
      }
    });
  },

  _commitView: function (view) {
    view.commit();
    // Commit moves values from form to model. We need to override model value after commit()
    if (view.model.changed.hasOwnProperty('name')) {
      this._sanitizeName(view.model.get('name'));
    }
  },

  _sanitizeName: function (name) {
    this._visMetadataModel.set('name', utils.sanitizeHtml(name));
  },

  _removeTooltip: function () {
    if (this._tooltip) {
      this._tooltip.clean();
    }
  },

  _removeBinds: function () {
    this._inputView && this._inputView.off('change', this._commitView, this);
    this._textareaView && this._textareaView.off('change', this._commitView, this);
    this._taglistView && this._taglistView.off('change', this._commitView, this);
  },

  clean: function () {
    this._removeBinds();
    CoreView.prototype.clean.call(this);
  }
});
