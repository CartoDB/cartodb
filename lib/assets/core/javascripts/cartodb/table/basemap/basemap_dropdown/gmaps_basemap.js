
/**
 *  Layers based on Google Maps v3
 */
cdb.admin.GMapsBaseView = cdb.admin.BaseLayerButton.extend({

  events: {
    'click': 'activate'
  },

  tagName: 'li',
  className: 'gmaps',

  initialize: function() {
    this.options = _.defaults(this.options,this.defaults);
    this.map = this.options.map;

    this.bindMap(this.map);
  },

  render: function() {
    var $e = $("<div class='thumb'></div>" );
    var $a = $(this.make("a", {
      "class": this.model.get('base_type') + " " + ( this.model.get('baseName') || "" )
      }, $e)
    );

    $a.attr("data-name", this.model.get("name"));

    this.$el.html($a);
    this.$el.attr('data-tipsy', this.model.get("name"));
    this.$el.attr("title", this.model.get("name"));

    this.$el.tipsy({ gravity: 's', live: true, fade: true }); 

    this.elder('render');

    return this;
  },

  activate: function(e) {
    e.preventDefault();
    cdb.god.trigger("closeDialogs");

    this.map.changeProvider('googlemaps', this.model.clone());
    return false;
  }
});
