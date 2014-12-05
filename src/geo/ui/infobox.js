
cdb.geo.ui.InfoBox = cdb.core.View.extend({

  className: 'cartodb-infobox',
  defaults: {
    pos_margin: 20,
    position: 'bottom|right',
    width: 200
  },

  initialize: function() {
    var self = this;
    _.defaults(this.options, this.defaults);
    if(this.options.layer) {
      this.enable();
    }
    this.setTemplate(this.options.template || this.defaultTemplate, 'mustache');
  },

  setTemplate: function(tmpl) {
    this.template = cdb.core.Template.compile(tmpl, 'mustache');
  },

  enable: function() {
    if(this.options.layer) {
      this.options.layer
        .on('featureOver', function(e, latlng, pos, data) {
          this.render(data).show();
        }, this)
        .on('featureOut', function() {
          this.hide();
        }, this);
    }
  },

  disable: function() {
    if(this.options.layer) {
      this.options.layer.off(null, null, this);
    }
  },

  // set position based on a string like "top|right", "top|left", "bottom|righ"...
  setPosition: function(pos) {
    var props = {};
    if(pos.indexOf('top') !== -1) {
      props.top = this.options.pos_margin;
    } else if(pos.indexOf('bottom') !== -1) {
      props.bottom = this.options.pos_margin;
    }

    if(pos.indexOf('left') !== -1) {
      props.left = this.options.pos_margin;
    } else if(pos.indexOf('right') !== -1) {
      props.right = this.options.pos_margin;
    }
    this.$el.css(props);

  },

  render: function(data) {
    this.$el.html( this.template(data) );
    if(this.options.width) {
      this.$el.css('width', this.options.width);
    }
    if(this.options.position) {
      this.setPosition(this.options.position);
    }
    return this;
  }

});

