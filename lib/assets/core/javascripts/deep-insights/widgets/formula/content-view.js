var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var formatter = require('../../formatter');
var template = require('./template.tpl');
var DropdownView = require('../dropdown/widget-dropdown-view');
var animationTemplate = require('./animation-template.tpl');
var AnimateValues = require('../animate-values.js');
var layerColors = require('../../util/layer-colors');
var Analyses = require('../../data/analyses');
var escapeHTML = require('../../util/escape-html');
var TooltipView = require('../widget-tooltip-view');

/**
 * Default widget content view:
 */
module.exports = CoreView.extend({
  className: 'CDB-Widget-body',

  initialize: function () {
    this._dataviewModel = this.model.dataviewModel;
    this._layerModel = this.model.layerModel;

    if (this.model.get('hasInitialState') === true) {
      this._initBinds();
    } else {
      this.model.once('change:hasInitialState', this._onInitialState, this);
    }
  },

  _onInitialState: function () {
    this._initBinds();
    this.render();
  },

  render: function () {
    this.clearSubViews();
    var value = this._dataviewModel.get('data');

    var format = function (value) {
      var formatter = d3.format('0,000');

      if (_.isNumber(value)) {
        return formatter(value.toFixed(2));
      }
      return 0;
    };

    var nulls = (!_.isUndefined(this._dataviewModel.get('nulls')) && formatter.formatNumber(this._dataviewModel.get('nulls'))) || '-';
    var isCollapsed = this.model.get('collapsed');

    var prefix = this.model.get('prefix');
    var suffix = this.model.get('suffix');

    var sourceId = this._dataviewModel.get('source').id;
    var letter = layerColors.letter(sourceId);
    var sourceColor = layerColors.getColorForLetter(letter);
    var sourceType = this._dataviewModel.getSourceType() || '';
    var isSourceType = this._dataviewModel.isSourceType();
    var layerName = isSourceType
      ? this.model.get('table_name')
      : this._layerModel.get('layer_name');

    this.$el.html(
      template({
        title: this.model.get('title'),
        sourceId: sourceId,
        sourceType: Analyses.title(sourceType),
        isSourceType: isSourceType,
        showStats: this.model.get('show_stats'),
        showSource: this.model.get('show_source') && letter !== '',
        operation: this._dataviewModel.get('operation'),
        value: value,
        formatedValue: format(value),
        description: this.model.get('description'),
        nulls: nulls,
        prefix: prefix,
        suffix: suffix,
        isCollapsed: isCollapsed,
        sourceColor: sourceColor,
        layerName: escapeHTML(layerName)
      })
    );

    var animator = new AnimateValues({
      el: this.$el
    });

    animator.animateValue(
      this._dataviewModel,
      'data',
      '.js-value',
      animationTemplate,
      {
        animationSpeed: 700,
        formatter: format,
        templateData: {
          prefix: prefix,
          suffix: suffix
        }
      }
    );

    this.$el.toggleClass('is-collapsed', !!isCollapsed);

    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:title change:description change:collapsed change:prefix change:suffix', this.render, this);
    this._dataviewModel.bind('change:data', this.render, this);
    this.add_related_model(this._dataviewModel);

    this._layerModel.bind('change:layer_name', this.render, this);
    this.add_related_model(this._layerModel);
  },

  _initViews: function () {
    var dropdown = new DropdownView({
      model: this.model,
      target: '.js-actions',
      container: this.$('.js-header')
    });
    this.addView(dropdown);

    var actionsTooltip = new TooltipView({
      context: this.$el,
      target: '.js-actions'
    });
    $('body').append(actionsTooltip.render().el);
    this.addView(actionsTooltip);
  }
});
