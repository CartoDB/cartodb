var _ = require('underscore');
var CustomListMultiItemView = require('builder/components/custom-list/custom-list-multi-item-view');

var NAME = _.template('<%-name %> (<%- items %>)');

module.exports = CustomListMultiItemView.extend({
  render: function () {
    this.clearSubViews();
    this.$el.empty();

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
