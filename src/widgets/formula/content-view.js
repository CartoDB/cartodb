var _ = require('underscore');
var d3 = require('d3');
var cdb = require('cartodb.js');
var formatter = require('../../formatter');
var template = require('./template.tpl');
var DropdownView = require('../dropdown/widget-dropdown-view');
var animationTemplate = require('./animation-template.tpl');
var AnimateValues = require('../animate-values.js');

/**
 * Default widget content view:
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-body',

  initialize: function () {
    this._dataviewModel = this.model.dataviewModel;
    this._initBinds();
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

    var nulls = !_.isUndefined(this._dataviewModel.get('nulls')) && formatter.formatNumber(this._dataviewModel.get('nulls')) || '-';
    var isCollapsed = this.model.get('collapsed');

    var prefix = this.model.get('prefix');
    var suffix = this.model.get('suffix');

    this.$el.html(
      template({
        title: this.model.get('title'),
        showStats: this.model.get('show_stats'),
        operation: this._dataviewModel.get('operation'),
        value: value,
        formatedValue: format(value),
        description: this.model.get('description'),
        nulls: nulls,
        prefix: prefix,
        suffix: suffix,
        isCollapsed: isCollapsed
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
    this.model.bind('change:title change:description change:pinned change:collapsed change:prefix change:suffix', this.render, this);
    this._dataviewModel.bind('change:data', this.render, this);
    this.add_related_model(this._dataviewModel);
  },

  _initViews: function () {
    var dropdown = new DropdownView({
      model: this.model,
      target: '.js-actions',
      container: this.$('.js-header')
    });

    this.addView(dropdown);
  }

});
