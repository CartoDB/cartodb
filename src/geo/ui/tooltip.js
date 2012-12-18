
cdb.geo.ui.Tooltip = cdb.core.View.extend({

  DEFAULT_OFFSET_TOP: 30,
  defaultTemplate: '<p>{{text}}</p>',
  className: 'cartodb_tooltip',

  initialize: function() {
    var self = this;
    if(this.options.layer) {
      this.enable();
    }
    this.template = cdb.core.Template.compile(this.options.template || this.defaultTemplate, 'mustache');
  },

  enable: function() {
    if(this.options.layer) {
      this.options.layer
        .on('featureOver', function(e, latlng, pos, data) {
          this.show(pos, data);
        }, this)
        .on('featureOut', function() {
          this.hide();
        }, this);
    }
  },

  disable: function() {
    if(this.options.layer) {
      this.options.layer.on(null, null, this);
    }
  },

  render: function(data) {
    this.$el.html( this.template(data) );
    return this;
  },

  show: function(pos, data) {
    this.render(data);
    this.elder('show');
    this.$el.css({
      'left': (pos.x - this.$el.width()/2),
      'top': (pos.y - (this.options.offset_top || this.DEFAULT_OFFSET_TOP))
    });
  }

});

