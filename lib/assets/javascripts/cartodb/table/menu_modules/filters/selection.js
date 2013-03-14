
(function() {

var SelectorView = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click': 'toggle'
  },

  initialize: function() {
    this.model.bind('change', this.render, this);
    this.template_base = _.template("<%= bucket %>  <div class='value'><%= value %></div>");
  },

  render: function() {

    //this.$el.html();
    this.$el.html(this.template_base(_.extend(this.model.toJSON(), this.options)));


    // this.model.get('bucket') this.model.get('value')

    if(this.model.get('selected')) {
      this.$el.addClass('selected');
    } else {
      this.$el.removeClass('selected');
    }

    return this;

  },

  toggle: function() {

    var m = this.model.get('selected')
    this.model.set('selected', !m);
  }

});

cdb.admin.mod.SelectorFilter = cdb.core.View.extend({

  tagName: 'li',
  className: 'histogram_filter',

  events: {
    'click a.remove': '_remove'
  },

  initialize: function() {
    this.model.items.bind('reset', this.render, this);
    this.add_related_model(this.model.items);
  },

  render: function() {
    var self = this;
    this.clearSubViews();
    this.$el.html(this.getTemplate('table/menu_modules/views/filter_selection')({
      legend: this.model.escape('column')
    }));
    var items = this.$('ul.items');
    this.model.items.each(function(m) {
      var v = new SelectorView({
        model: m
      });
      items.append(v.render().el);
      self.addView(v);
    });
    return this;
  },

  _remove: function() {
    this.model.destroy();
  }
});


})();
