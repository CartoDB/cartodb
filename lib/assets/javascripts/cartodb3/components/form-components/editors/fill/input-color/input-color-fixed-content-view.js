var _ = require('underscore');
var CoreView = require('backbone/core-view');
var tabPaneTemplate = require('../fill-tab-pane.tpl');
var createTextLabelsTabPane = require('../../../../../components/tab-pane/create-text-labels-tab-pane');
var ColorPicker = require('../color-picker/color-picker');
var InputColorFileView = require('./input-color-file-view');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (this.options.editorAttrs) {
      var editorAttrs = this.options.editorAttrs;

      if (editorAttrs.hidePanes) {
        var hidePanes = editorAttrs.hidePanes;
        if (!_.contains(hidePanes, 'value')) {
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

    var self = this;

    var fixedPane = {
      name: 'fixed',
      label: _t('form-components.editors.fill.input-color.solid'),
      createContentView: function () {
        return self._generateFixedContentView();
      }
    };

    var filePane = {
      name: 'file',
      label: 'Img',
      createContentView: function () {
        return self._generateFileContentView();
      }
    };

    this._tabPaneTabs = [];

    if (this.options.editorAttrs && this.options.editorAttrs.hidePanes) {
      hidePanes = this.options.editorAttrs.hidePanes;
      if (!_.contains(hidePanes, 'fixed')) {
        this._tabPaneTabs.push(fixedPane);
      }
      if (!_.contains(hidePanes, 'value')) {
        this._tabPaneTabs.push(filePane);
      }
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

    if (this.model.get('range') && this._tabPaneTabs.length > 1) {
      this._tabPaneTabs[1].selected = true;
    }

    this._tabPaneView = createTextLabelsTabPane(this._tabPaneTabs, tabPaneOptions);
    this.addView(this._tabPaneView);
  },

  render: function () {
    this.$el.append(this._tabPaneView.render().$el);
    return this;
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
      this.model.set({ image: url });
    } else {
      this.model.unset('image');
    }
  },

  _onChangeValue: function (color) {
    this.model.set({ fixed: color.hex, opacity: color.opacity });
  }
});
