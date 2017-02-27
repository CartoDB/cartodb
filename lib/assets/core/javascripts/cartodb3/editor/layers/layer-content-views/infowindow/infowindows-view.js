var _ = require('underscore');
var CoreView = require('backbone/core-view');
var InfowindowView = require('./infowindow-click-view');
var TooltipView = require('./infowindow-hover-view');
var createTextLabelsTabPane = require('../../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../../tab-pane-submenu.tpl');
var popupPlaceholderTemplate = require('./popups-placeholder.tpl');
var georeferencePlaceholderTemplate = require('./georeference-placeholder.tpl');
var loadingTemplate = require('../../panel-loading-template.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var QueryRowsCollection = require('../../../../data/query-rows-collection');
var VisTableModel = require('../../../../data/visualization-table-model');

var REQUIRED_OPTS = [
  'configModel',
  'userActions',
  'layerDefinitionModel',
  'querySchemaModel',
  'queryGeometryModel',
  'editorModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._layerInfowindowModel = this._layerDefinitionModel.infowindowModel;
    this._layerTooltipModel = this._layerDefinitionModel.tooltipModel;

    this._initModels();
    this._initBinds();

    if (this._queryGeometryModel.shouldFetch()) {
      this._queryGeometryModel.fetch();
    }

    if (this._querySchemaModel.shouldFetch()) {
      this._querySchemaModel.fetch();
    } else if (this._querySchemaModel.isFetched()) {
      this._fetchRowsData();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._queryGeometryModel.isFetching()) {
      this._renderLoading();
    } else if (this._layerInfowindowModel && this._hasColumns() && this._canAddInfowindow() && this._queryGeometryModel.hasValue()) {
      this._initViews();
      this._bindEvents();
    } else {
      this._renderPlaceholder();
    }

    return this;
  },

  _initModels: function () {
    this._editorModel.set({
      edition: false
    });

    this._initRowsCollection();
  },

  _initBinds: function () {
    this.listenTo(this._querySchemaModel, 'change:status', _.debounce(this._onStatusChanged.bind(this), 100));
    this.listenTo(this._queryGeometryModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
  },

  _onStatusChanged: function () {
    if (this._querySchemaModel.isFetched() && this._queryGeometryModel.isFetched()) {
      var analysisDefinitionNodeModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();

      if (!this._layerDefinitionModel.hasAnalyses() &&
          !analysisDefinitionNodeModel.isCustomQueryApplied()) {
        this._fetchRowsData();
      } else {
        this.render();
      }
    }
  },

  _fetchRowsData: function () {
    this._rowsCollection.fetch({
      data: {
        page: 0,
        rows_per_page: 1,
        order_by: '',
        sort_order: '',
        exclude: []
      },
      success: function () {
        this.render();
      }.bind(this)
    });
  },

  _hasColumns: function () {
    if (!this._querySchemaModel.isFetched()) return false;

    var columns = this._querySchemaModel.columnsCollection.models;

    var filteredColumns = _(columns).filter(function (c) {
      return !_.contains(this._layerInfowindowModel.SYSTEM_COLUMNS, c.get('name'));
    }, this);

    return filteredColumns.length;
  },

  _canAddInfowindow: function () {
    var styleModel = this._layerDefinitionModel.styleModel;
    return styleModel && !styleModel.isAggregatedType() && !styleModel.isAnimation();
  },

  _renderPlaceholder: function () {
    if (this._layerInfowindowModel && !this._hasColumns()) {
      this.$el.append(popupPlaceholderTemplate({
        placeholder: _t('editor.layers.infowindow.placeholder-columns-text')
      }));
    } else if (!this._queryGeometryModel.hasValue() && this._rowsCollection.length === 0) {
      this.$el.append(popupPlaceholderTemplate({
        placeholder: _t('editor.layers.infowindow.placeholder-geometry')
      }));
    } else if (!this._queryGeometryModel.hasValue() && this._rowsCollection.length > 0) {
      this._renderGeoreferencePlaceholder();
    } else {
      this.$el.append(popupPlaceholderTemplate({
        placeholder: _t('editor.layers.infowindow.placeholder-interactivity-text')
      }));
    }
  },

  _renderGeoreferencePlaceholder: function () {
    this.$el.append(georeferencePlaceholderTemplate());
  },

  _initRowsCollection: function () {
    var tableName = '';
    var tableModel;

    this._sourceNode = this._getSourceNode();

    if (this._sourceNode) {
      tableName = this._sourceNode.get('table_name');
      this._visTableModel = new VisTableModel({
        id: tableName,
        table: {
          name: tableName
        }
      }, {
        configModel: this._configModel
      });
    }

    if (this._visTableModel) {
      tableModel = this._visTableModel.getTableModel();
      tableName = tableModel.getUnquotedName();
    }

    this._rowsCollection = new QueryRowsCollection([], {
      configModel: this._configModel,
      tableName: tableName,
      querySchemaModel: this._querySchemaModel
    });
  },

  _getSourceNode: function () {
    var node = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    var source;
    var primarySource;

    if (node.get('type') === 'source') {
      source = node;
    } else {
      primarySource = node.getPrimarySource();
      if (primarySource && primarySource.get('type') === 'source') {
        source = primarySource;
      }
    }

    return source;
  },

  _renderLoading: function () {
    this.$el.append(loadingTemplate());
  },

  _initViews: function () {
    var self = this;

    var clickTemplate = _t('editor.layers.infowindow.style.none');
    var hoverTemplate = _t('editor.layers.tooltip.style.none');

    if (this._layerInfowindowModel.isCustomTemplate()) {
      clickTemplate = _t('editor.layers.infowindow.style.custom');
    } else if (this._layerInfowindowModel.hasTemplate()) {
      clickTemplate = _t('editor.layers.infowindow.style.' + this._layerInfowindowModel.get('template_name'));
    }

    if (this._layerTooltipModel.isCustomTemplate()) {
      hoverTemplate = _t('editor.layers.tooltip.style.custom');
    } else if (this._layerTooltipModel.hasTemplate()) {
      hoverTemplate = _t('editor.layers.tooltip.style.' + this._layerTooltipModel.get('template_name'));
    }

    var tabPaneTabs = [{
      name: 'click',
      label: _t('editor.layers.infowindow-menu-tab-pane-labels.click'),
      createContentView: function () {
        return new InfowindowView({
          model: self._layerInfowindowModel,
          className: 'Editor-content',
          querySchemaModel: self._querySchemaModel,
          userActions: self._userActions,
          editorModel: self._editorModel,
          layerDefinitionModel: self._layerDefinitionModel
        });
      },
      selectedChild: clickTemplate
    }, {
      name: 'hover',
      label: _t('editor.layers.infowindow-menu-tab-pane-labels.hover'),
      createContentView: function () {
        return new TooltipView({
          className: 'Editor-content',
          querySchemaModel: self._querySchemaModel,
          userActions: self._userActions,
          editorModel: self._editorModel,
          model: self._layerTooltipModel,
          layerDefinitionModel: self._layerDefinitionModel
        });
      },
      selectedChild: hoverTemplate
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavSubmenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavSubmenu-link u-upperCase'
      }
    };

    this._layerTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);
  },

  _changeStyle: function (m) {
    this._layerTabPaneView && this._layerTabPaneView.changeStyleMenu(m);
  },

  _updateSelectedChild: function () {
    var selectedChild;
    var selectedChildTxt;

    switch (this._layerTabPaneView.getSelectedTabPaneName()) {
      case 'click':
        selectedChild = this._layerInfowindowModel.get('template_name');
        selectedChildTxt = _t('editor.layers.infowindow.style.none');

        if (this._layerInfowindowModel.isCustomTemplate()) {
          selectedChildTxt = _t('editor.layers.infowindow.style.custom');
        } else if (this._layerInfowindowModel.hasTemplate()) {
          selectedChildTxt = _t('editor.layers.infowindow.style.' + selectedChild);
        }

        break;
      case 'hover':
        selectedChild = this._layerTooltipModel.get('template_name');
        selectedChildTxt = _t('editor.layers.tooltip.style.none');

        if (this._layerTooltipModel.isCustomTemplate()) {
          selectedChildTxt = _t('editor.layers.tooltip.style.custom');
        } else if (this._layerTooltipModel.hasTemplate()) {
          selectedChildTxt = _t('editor.layers.tooltip.style.' + selectedChild);
        }

        break;
    }

    this._layerTabPaneView.$('.js-menu .CDB-NavSubmenu-item.is-selected .js-NavSubmenu-status').html(selectedChildTxt);
    this._layerTabPaneView.$('.js-list .Carousel-item').removeClass('is-selected');
    this._layerTabPaneView.$('.js-list .Carousel-item.js-' + selectedChild).addClass('is-selected');
  },

  _bindEvents: function () {
    this._layerInfowindowModel.on('change:template', this._onChangeTemplate, this);
    this.add_related_model(this._layerInfowindowModel);
    this._layerTooltipModel.on('change:template', this._onChangeTemplate, this);
    this.add_related_model(this._layerTooltipModel);
  },

  _onChangeTemplate: function () {
    this._updateSelectedChild();
  }

});
