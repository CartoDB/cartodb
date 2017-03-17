var _ = require('underscore');
var BaseView = require('../../../custom-list/custom-list-multi-item-view');

var NAME = _.template('<%-name %> (<%- items %>)');

module.exports = BaseView.extend({
  render: function () {
    this.$el.empty();
    this.clearSubViews();

    var name = this.model.getName() == null ? 'null' : this.model.getName();
    name = name.replace(/"/g, '');

    this.$el.append(
      this.options.template(
        _.extend({
          isSelected: this.model.get('selected'),
          isDisabled: this.model.get('disabled'),
          name: NAME({
            name: name,
            items: this.model.get('items')
          }),
          val: this.model.getValue(),
          description: this.model.get('description')
        })
      )
    );

    this.$el
      .attr('data-val', this.model.getValue())
      .toggleClass('is-disabled', !!this.model.get('disabled'));

    return this;
  }
});
