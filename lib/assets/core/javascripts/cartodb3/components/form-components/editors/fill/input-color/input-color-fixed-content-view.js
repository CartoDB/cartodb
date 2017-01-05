var _ = require('underscore');
var CoreView = require('backbone/core-view');
var tabPaneTemplate = require('../fill-tab-pane.tpl');
var createMixedLabelsTabPane = require('../../../../../components/tab-pane/create-mixed-labels-tab-pane');
var ColorPicker = require('../color-picker/color-picker');
var InputColorFileView = require('./input-color-file-view');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (this.options.editorAttrs) {
      var editorAttrs = this.options.editorAttrs;

      this._imageEnabled = editorAttrs.imageEnabled;

      if (editorAttrs.hidePanes) {
        this._hidePanes = editorAttrs.hidePanes;
        if (!_.contains(this._hidePanes, 'value')) {
          if (!opts.configModel) throw new Error('configModel param is required');
          if (!opts.userModel) throw new Error('userModel param is required');
          if (!opts.modals) throw new Error('modals param is required');
        }
      }

      if (editorAttrs.disableOpacity) {
        this._disableOpacity = true;
      }
    }

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._modals = opts.modals;
    this._query = opts.query;

    if (this._imageEnabled && this._userModel && this._userModel.featureEnabled('icon-styling')) {
      this._setupTabPanes();
    }
  },

  render: function () {
    if (this._tabPaneView) {
      this.$el.append(this._tabPaneView.render().$el);
    } else {
      this.$el.append(this._generateFixedContentView().render().$el);
    }
    return this;
  },

  _setupTabPanes: function () {
    var self = this;

    var fixedPane = {
      name: 'fixed',
      type: 'color',
      label: this.model.get('fixed'),
      createContentView: function () {
        return self._generateFixedContentView();
      }
    };

    var filePane = {
      name: 'file',
      type: this.model.get('image') ? 'image' : 'text',
      label: this.model.get('image') ? this.model.get('image') : _t('form-components.editors.fill.input-color.img'),
      color: this.model.get('fixed'),
      createContentView: function () {
        return self._generateFileContentView();
      }
    };

    this._tabPaneTabs = [];

    if (this.options.editorAttrs && this.options.editorAttrs.hidePanes) {
      this._hidePanes = this.options.editorAttrs.hidePanes;

      if (!_.contains(this._hidePanes, 'fixed')) {
        this._tabPaneTabs.push(fixedPane);
      }
      // if (!_.contains(this._hidePanes, 'value')) {
        this._tabPaneTabs.push(filePane);
      // }
    } else {
      this._tabPaneTabs = [fixedPane, filePane];
    }

    var tabPaneOptions = {
      tabPaneOptions: {
        template: tabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase'
      }
    };

    if (this.model.get('image') && this._tabPaneTabs.length > 1) {
      this._tabPaneTabs[1].selected = true;
    }
    this.model.bind('change:image', this._updateImageTabPane, this);
    this.model.bind('change:fixed', this._updateTextTabPane, this);

    this._tabPaneView = createMixedLabelsTabPane(this._tabPaneTabs, tabPaneOptions);
    this.addView(this._tabPaneView);
  },

  _updateTextTabPane: function () {
    this._updateImageTabPane();
    this._tabPaneView.collection.at(0).set('label', this.model.get('fixed'));
  },

  _updateImageTabPane: function () {
    if (this.model.get('image')) {
      this._tabPaneView.collection.at(1).set({ label: this.model.get('image'), color: this.model.get('fixed') });
    } else {
      this._tabPaneView.collection.at(1).set('label', _t('form-components.editors.fill.input-color.img'));
    }
  },

  _generateFixedContentView: function () {
    var contentView = new ColorPicker({
      value: this.model.get('fixed'),
      opacity: this.model.get('opacity'),
      disableOpacity: this._disableOpacity
    });

    contentView.bind('change', this._onChangeValue, this);
    return contentView;
  },

  _generateFileContentView: function () {
    var contentView = new InputColorFileView({
      model: this.model,
      userModel: this._userModel,
      configModel: this._configModel,
      modals: this._modals
    });

    contentView.bind('change', this._onChangeFile, this);
    return contentView;
  },

  _onChangeFile: function (url) {
    if (url) {
      this.model.set('image', url);
    } else {
      this.model.unset('image');
    }
  },

  _onChangeValue: function (color) {
    this.model.set({ fixed: color.hex, opacity: color.opacity });
  }
});
