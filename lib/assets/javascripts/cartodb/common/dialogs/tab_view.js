module.exports = cdb.core.View.extend({

  events: {
    'click button': '_onClick'
  },

  _onClick: function(ev) {
    this.killEvent(ev);
    this.model.get('name');
  }
})
