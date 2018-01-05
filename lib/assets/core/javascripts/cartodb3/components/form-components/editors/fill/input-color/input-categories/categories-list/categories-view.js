var CustomView = require('../../../../../../custom-list/custom-view.js');
var itemTemplate = require('../../../../../../custom-list/custom-list-item.tpl');
var CategoriesListItemView = require('./categories-list-item-view');
var CategoriesListView = require('./categories-list-view');

module.exports = CustomView.extend({
  options: {
    showSearch: true,
    allowFreeTextInput: false,
    typeLabel: 'column',
    itemTemplate: itemTemplate,
    itemView: CategoriesListItemView
  },

  _renderList: function () {
    this._listView = new CategoriesListView({
      model: this.model,
      allowFreeTextInput: this.options.allowFreeTextInput,
      collection: this.collection,
      typeLabel: this.options.typeLabel,
      itemView: this.options.itemView,
      itemTemplate: this.options.itemTemplate,
      size: this.options.size,
      maxValues: this.options.maxValues,
      imageEnabled: this.options.imageEnabled
    });
    this.$el.append(this._listView.render().el);
    this._listView.highlight();
    this.addView(this._listView);

    // 'customEvent' comes from custom list component
    this._listView.bind('customEvent', function (eventName, item) {
      this.trigger(eventName, item, this);
    }, this);
  }
});
