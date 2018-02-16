var _ = require('underscore');
var BaseView = require('builder/components/custom-list/custom-list-item-view');

module.exports = BaseView.extend({
  render: function () {
    this.$el.empty();
    this.clearSubViews();

    var name = this.model.getName() == null ? 'null' : this.model.getName();
    var isSelected = this.model.get('selected');

    this.$el.append(
      this.options.template(
        _.extend({
          isSelected: isSelected,
          isDisabled: this.model.get('disabled'),
          name: name,
          val: this.model.getValue(),
          description: this.model.get('description')
        })
      )
    );

    this.$el
      .attr('data-val', this.model.getValue())
      .attr('data-selected', isSelected)
      .toggleClass('is-disabled', !!this.model.get('disabled'));

    return this;
  },

  _onMouseLeave: function () {
    var selected = this.$el.attr('data-selected');
    if (!selected) {
      this.$el.removeClass('is-highlighted');
    }
  },

  _onMouseEnter: function () {
    var selected = this.$el.attr('data-selected');
    if (!selected) {
      this.$el.addClass('is-highlighted');
    }
  }
});
