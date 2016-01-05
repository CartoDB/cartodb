var _ = require('underscore');
var d3 = require('d3');
var formatter = require('../../formatter');
var WidgetContent = require('../standard/widget-content-view');
var template = require('./template.tpl');
var DropdownView = require('../dropdown/widget-dropdown-view');
var animationTemplate = require('./animation-template.tpl');
var AnimateValues = require('../animate-values.js');

/**
 * Default widget content view:
 */
module.exports = WidgetContent.extend({
  initialize: function () {
    this.dataModel = this.model.dataviewModel;
    WidgetContent.prototype.initialize.call(this);
  },

  render: function () {
    this.clearSubViews();
    var value = this.dataModel.get('data');

    var format = function (value) {
      var formatter = d3.format('0,000');

      if (_.isNumber(value)) {
        return formatter(value.toFixed(2));
      }
      return 0;
    };

    var nulls = !_.isUndefined(this.dataModel.get('nulls')) && formatter.formatNumber(this.dataModel.get('nulls')) || '-';
    var isCollapsed = this.model.isCollapsed();

    var prefix = this.dataModel.get('prefix');
    var suffix = this.dataModel.get('suffix');

    this.$el.html(
      template({
        title: this.model.get('title'),
        operation: this.dataModel.get('operation'),
        value: value,
        formatedValue: format(value),
        nulls: nulls,
        prefix: prefix,
        suffix: suffix,
        isCollapsed: isCollapsed
      })
    );

    var animator = new AnimateValues({
      el: this.$el
    });

    animator.animateValue(this.dataModel, 'data', '.js-value', animationTemplate, { animationSpeed: 700, formatter: format, templateData: { prefix: prefix, suffix: suffix } });

    this.$el.toggleClass('is-collapsed', !!isCollapsed);

    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:collapsed', this.render, this);
    WidgetContent.prototype._initBinds.call(this);
  },

  _initViews: function () {
    var dropdown = new DropdownView({
      target: this.$('.js-actions'),
      container: this.$('.js-header')
    });

    dropdown.bind('click', function (action) {
      if (action === 'toggle') {
        this.model.toggleCollapsed();
      }
    }, this);

    this.addView(dropdown);
  }

});
