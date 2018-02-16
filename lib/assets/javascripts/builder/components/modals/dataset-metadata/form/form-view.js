var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var templateForm = require('./form.tpl');
require('builder/components/form-components/index');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var utils = require('builder/helpers/utils');

var REQUIRED_OPTS = [
  'visDefinitionModel',
  'visMetadataModel',
  'configModel'
];

module.exports = CoreView.extend({
  className: 'Metadata-form',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    if (opts.isLocked === undefined) throw new TypeError('isLocked is required');
    this._isLocked = opts.isLocked;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(templateForm());
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._addNameView();
    this._addDescriptionView();
    this._addSourceView();
    this._addAttributionView();
    this._addLicenseView();
    this._addTagsView();
    this._addTooltip();
  },

  _addInputView: function (key, view, placeholder, container, disabled) {
    var obj = '_' + view;
    var $view = new Backbone.Form.editors.Text({
      key: key,
      model: this._visMetadataModel,
      schema: {
        options: this._visDefinitionModel.get(key),
        editorAttrs: {
          placeholder: placeholder,
          disabled: disabled || false
        }
      }
    });
    $view.on('change', this._commitView, this);
    this[obj] = $view;
    container.append($view.render().$el);
  },

  _addNameView: function () {
    this._addInputView('name', 'nameInput', _t('components.modals.dataset-metadata.form.name-placeholder'), this.$('.js-name-field'), this._isLocked);
  },

  _addSourceView: function () {
    this._addInputView('source', 'sourceInput', _t('components.modals.dataset-metadata.form.source-placeholder'), this.$('.js-source-field'));
  },

  _addAttributionView: function () {
    this._addInputView('attributions', 'attributionInput', _t('components.modals.dataset-metadata.form.attributions-placeholder'), this.$('.js-attributions-field'));
  },

  _buildLicenseOptions: function () {
    var items = this._configModel.get('licenses');
    var emptyOption = [{
      id: '',
      name: '-'
    }];
    return _.chain(emptyOption.concat(items))
      .compact()
      .map(function (d) {
        return {
          val: d.id,
          label: d.name
        };
      })
      .value();
  },

  _addLicenseView: function () {
    var options = this._buildLicenseOptions();

    this._selectView = new Backbone.Form.editors.Select({
      className: 'u-flex u-alignCenter',
      key: 'license',
      schema: {
        options: options
      },
      model: this._visMetadataModel,
      showSearch: false
    });

    this._selectView.on('change', this._commitView, this);
    this._selectView.setValue(this._visMetadataModel.get('license') || 0);
    this.$('.js-license-field').append(this._selectView.render().$el);
  },

  _addDescriptionView: function () {
    this._descriptionView = new Backbone.Form.editors.TextArea({
      className: 'CDB-Textarea Metadata-textarea',
      key: 'description',
      model: this._visMetadataModel,
      schema: {
        options: this._visDefinitionModel.get('description'),
        editorAttrs: {
          placeholder: _t('components.modals.dataset-metadata.form.description-placeholder')
        }
      }
    });

    this._descriptionView.on('change', this._commitView, this);

    this.$('.js-description-field').append(this._descriptionView.render().$el);
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
    this._nameView && this._nameView.off('change', this._commitView, this);
    this._descriptionView && this._descriptionView.off('change', this._commitView, this);
    this._taglistView && this._taglistView.off('change', this._commitView, this);
    this._sourceInput && this._sourceInput.off('change', this._commitView, this);
    this._attributionView && this._attributionView.off('change', this._commitView, this);
    this._selectView && this._selectView.off('change', this._commitView, this);
  },

  clean: function () {
    this._removeBinds();
    CoreView.prototype.clean.call(this);
  }
});
