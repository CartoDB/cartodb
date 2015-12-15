var View = cdb.core.View
var formatter = cdb.core.format
var clickableTemplate = require('./item-clickable-template.tpl')
var unclickableTemplate = require('./item-unclickable-template.tpl')

/**
 * Category list item view
 */
module.exports = View.extend({
  tagName: 'li',
  className: 'CDB-Widget-listItem',

  events: {
    'click .js-button': '_onItemClick'
  },

  initialize: function (options) {
    this.dataModel = this.options.dataModel
    this._initBinds()
  },

  render: function () {
    var value = this.model.get('value')
    var template = this.model.get('agg') || this.dataModel.isLocked()
      ? unclickableTemplate
      : clickableTemplate

    this.$el.html(
      template({
        customColor: this.dataModel.isColorApplied(),
        isAggregated: this.model.get('agg'),
        name: this.model.get('name'),
        value: value,
        formattedValue: formatter.formatNumber(value),
        percentage: ((value / this.dataModel.get('max')) * 100),
        color: this.model.get('color'),
        isDisabled: !this.model.get('selected') ? 'is-disabled' : '',
        prefix: this.dataModel.get('prefix'),
        suffix: this.dataModel.get('suffix')
      })
    )

    return this
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this)
    this.dataModel.bind('change:search change:categoryColors', this.render, this)
    this.add_related_model(this.dataModel)
  },

  _onItemClick: function () {
    this.trigger('itemClicked', this.model, this)
  }

})
