var cdb = require('cartodb.js');
var _ = require('underscore');
var template = require('./custom-list-item.tpl');

/*
 *  Item list default view
 *
 */

module.exports = cdb.core.View.extend({

  className: 'CDB-ListDecoration-Item',
  tagName: 'li',

  events: {
    'click': '_onClick'
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();

    this.$el.append(
      template(
        _.extend({
          typeLabel: this.options.typeLabel,
          name: this.model.getName()
        })
      )
    );

    return this;
  },

  _onClick: function (e) {
    e.stopPropagation();
    this.model.set('selected', true);
  }

});
