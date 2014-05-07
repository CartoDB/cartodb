
cdb.geo.ui.Tooltip = cdb.geo.ui.InfoBox.extend({

  DEFAULT_OFFSET_TOP: 10,
  defaultTemplate: '<p>{{text}}</p>',
  className: 'cartodb-tooltip',

  initialize: function() {
    this.options.template = this.options.template || this.defaultTemplate;
    this.options.position = 'none';
    this.options.width = null;
    cdb.geo.ui.InfoBox.prototype.initialize.call(this);
  },

  setLayer: function(layer) {
    this.options.layer = layer;
    return this;
  },

  enable: function() {
    if(this.options.layer) {
      this.options.layer
        .on('featureOver', function(e, latlng, pos, data) {

          // this flag is used to be compatible with previous templates
          // where the data is not enclosed a content variable
          if (this.options.wrapdata) {

            var non_valid_keys = ['fields', 'content']
            // Remove fields and content from data
            // and make them visible for custom templates
            data.content = _.omit(data, non_valid_keys);

            // loop through content values
            data.fields = _.map(data.content, function(v, k) {
              return {
                title: k,
                value: v
              };
            });
          }
          this.show(pos, data);
        }, this)
        .on('featureOut', function() {
          this.hide();
        }, this);
      this.add_related_model(this.options.layer);
    }
  },

  disable: function() {
    if(this.options.layer) {
      this.options.layer.unbind(null, null, this);
    }
  },

  show: function(pos, data) {
    this.render(data);
    this.elder('show', pos, data);
    this.$el.css({
      'left': pos.x,
      'top':  pos.y + (this.options.offset_top || this.DEFAULT_OFFSET_TOP)
    });
  },

  render: function(data) {
    this.$el.html( this.template(data) );
    return this;
  }

});

