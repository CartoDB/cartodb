var _ = require('underscore');
var BaseView = require('../../../custom-list/custom-list-item-view');

module.exports = BaseView.extend({
  render: function () {
    this.$el.empty();
    this.clearSubViews();

    var name = this.model.getName() == null ? 'null' : this.model.getName();

    this.$el.append(
      this.options.template(
        _.extend({
          isSelected: this.model.get('selected'),
          isDisabled: this.model.get('disabled'),
          name: name,
          val: this.model.getValue(),
          description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'  // this.model.get('description')
        })
      )
    );

    this.$el
      .attr('data-val', this.model.getValue())
      .toggleClass('is-disabled', !!this.model.get('disabled'));

    return this;
  }
});
