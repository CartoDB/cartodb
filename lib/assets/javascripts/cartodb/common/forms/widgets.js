
cdb.forms.Color = cdb.core.View.extend({
  className: 'form_color',
  initialize: function() {
    this.model.bind('change', this.render, this);
    this.add_related_model(this.model);
  },
  render: function() {
    this.$el.html('<span class="color"></span>');
    this.$el.css('background-color', this.model.get(this.property));
    return this;
  }
});

cdb.forms.Spinner = cdb.core.View.extend({
  className: 'form_spinner',

  events: {
    'click .plus': '_plus',
    'click .minus': '_minus'
  },

  initialize: function() {
    this.property = this.options.property;
    this.model.bind('change', this.render, this);
    this.add_related_model(this.model);
  },

  inc: function(c) {
    var a = {};
    a[this.property] = this.model.get(this.property) + c;
    this.model.set(a);
  },

  _plus: function(e) {
    e.preventDefault();
    this.inc(1);
    return false;
  },

  _minus: function(e) {
    e.preventDefault();
    this.inc(-1);
    return false;
  },

  render: function() {
    this.$el.html('<span class="value"></span><a href="#" class="plus">+</a><a href="#" class="minus">-</a>');
    this.$('.value').html(this.model.get(this.property));
    return this;
  }

});
