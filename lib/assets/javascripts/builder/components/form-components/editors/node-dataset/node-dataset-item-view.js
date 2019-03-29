var CustomListItemView = require('builder/components/custom-list/custom-list-item-view');
var _ = require('underscore');

module.exports = CustomListItemView.extend({

  render: function () {
    this.$el.empty();
    this.clearSubViews();

    this.$el.append(
      this.options.template(
        _.extend(
          {
            typeLabel: this.options.typeLabel,
            isSelected: this.model.get('selected'),
            isSourceType: this.model.get('isSourceType'),
            name: this.model.getName(),
            val: this.model.getValue()
          },
          this.model.attributes
        )
      )
    );

    this.$el
      .attr('data-val', this.model.getValue())
      .toggleClass('is-disabled', !!this.model.get('disabled'));

    return this;
  }

});
