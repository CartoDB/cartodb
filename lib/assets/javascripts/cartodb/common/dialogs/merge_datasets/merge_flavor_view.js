var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({

  className: 'OptionCard OptionCard--blocky',

  events: {
    'click': '_onClick'
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/merge_datasets/merge_flavor')({
        illustrationIconType: this.model.ILLUSTRATION_ICON_TYPE,
        icon: this.model.ICON,
        title: this.model.TITLE,
        desc: this.model.DESC
      })
    );

    if (!this.model.isAvailable()) {
      this.$el.addClass('is-disabled');
    }

    return this;
  },

  _onClick: function(ev) {
    this.killEvent(ev);
    if (this.model.isAvailable()) {
      this.model.set('selected', true);
    }
  }
});
