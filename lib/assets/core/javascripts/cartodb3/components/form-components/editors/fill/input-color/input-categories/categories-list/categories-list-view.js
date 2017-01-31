var CustomListView = require('../../../../../../custom-list/custom-list-view');

module.exports = CustomListView.extend({
  _renderItem: function (mdl) {
    var ItemViewClass = this.options.ItemView;
    var itemView = new ItemViewClass({
      model: mdl,
      typeLabel: this.options.typeLabel,
      template: this.options.itemTemplate,
      imageEnabled: this.options.imageEnabled
    });
    this.$('.js-list').append(itemView.render().el);
    this.addView(itemView);

    itemView.bind('customEvent', function (eventName, item) {
      this.trigger('customEvent', eventName, item, this);
    }, this);
  }
});
