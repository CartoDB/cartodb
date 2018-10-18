var CustomListItemView = require('./custom-list-item-view');

module.exports = CustomListItemView.extend({
  _onClick: function (ev) {
    this.killEvent(ev);
    this.model.set('selected', !this.model.get('selected'));
  }
});
