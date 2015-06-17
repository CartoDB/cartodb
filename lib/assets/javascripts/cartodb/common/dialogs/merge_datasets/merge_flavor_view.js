var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({

  className: 'OptionCard',

  events: {
    'click': '_onClick'
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/merge_datasets/merge_flavor')({
        illustrationIconType: this.model.illustrationIconType,
        icon: this.model.icon,
        title: this.model.title,
        desc: this.model.desc
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
