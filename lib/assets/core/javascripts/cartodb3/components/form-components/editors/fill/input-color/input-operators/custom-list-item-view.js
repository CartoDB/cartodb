var CustomListItemView = require('../../../../../custom-list/custom-list-item-view');

module.exports = CustomListItemView.extend({
  _onClick: function (ev) {
    this.killEvent(ev);
    this.model.set({
      selected: true
    });
    this.model.trigger('change', this.model);
  }
});
