var cdb = require('cartodb.js');
var _ = require('underscore');
var template = require('./custom-list-item.tpl');

module.exports = cdb.core.View.extend({

  className: 'CDB-ListDecoration-Item js-listItem',
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
          isSelected: this.model.get('selected'),
          name: this.model.getName()
        })
      )
    );

    this.$el.attr('data-val', this.model.getValue());

    return this;
  },

  _onClick: function (e) {
    e.stopPropagation();
    this.model.set('selected', true);
  }

});
