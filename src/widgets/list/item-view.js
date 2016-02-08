var _ = require('underscore');
var format = require('../../formatter');
var cdb = require('cartodb.js');
var template = require('./item-template.tpl');

module.exports = cdb.core.View.extend({
  tagName: 'li',
  className: 'CDB-Widget-listItem',

  events: {
    'click .js-button': '_onItemClick'
  },

  initialize: function () {
    this._widgetModel = this.options.widgetModel;
    this._dataviewModel = this.options.dataviewModel;
  },

  render: function () {
    var data = this.model.toJSON();
    var hasInteractivity = this._hasInteractivity(data);
    var items = this._sanitizeData(data);

    this.$el.html(
      template({
        items: items,
        isClickable: hasInteractivity,
        itemsCount: _.size(items)
      })
    );

    // If there is no cartodb_id defined, click event should
    // be disabled
    this[ hasInteractivity ? 'delegateEvents' : 'undelegateEvents' ]();
    return this;
  },

  // Remove cartodb_id, if exists
  // Replace titles if there are alternatives
  // Convert data object to array items
  _sanitizeData: function (data) {
    var hasInteractivity = this._hasInteractivity(data);
    data = _.omit(data, function (value, key, object) {
      return key === 'cartodb_id';
    });

    var columnTitles = this._widgetModel.get('columns_title');
    if (hasInteractivity && !_.isEmpty(columnTitles)) {
      columnTitles = _.rest(columnTitles, 1);
    }

    // Convert to pair items and check if there is a column title
    var arr = [];
    var i = 0;

    _.each(data, function (value, key) {
      var title = columnTitles && columnTitles[i] || key;
      arr.push([ title, format.formatValue(value) ]);
      ++i;
    });

    return arr;
  },

  _hasInteractivity: function (data) {
    return !_.isEmpty(
      _.filter(data, function (value, key) {
        return key === 'cartodb_id';
      })
    );
  },

  _onItemClick: function () {
    this.trigger('itemClicked', this.model, this);
  }

});
