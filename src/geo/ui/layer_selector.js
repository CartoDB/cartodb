/**
* Model for the Layer collection
*/
cdb.geo.ui.Layer = cdb.core.Model.extend({

  defaults: {
    disabled: true,
    selected: false
  }

});

/**
* View for each one of the layers
*/
cdb.geo.ui.LayerView = cdb.core.View.extend({

  tagName: "li",

  defaults: {
    template: '<a class="layer" href="#"><%= name %></a> <a href="#switch" class="right switch disabled"><span class="handle"></span></a>'
  },

  events: {
    "click": '_onSwitchClick',
  },

  initialize: function() {

    this.model = new cdb.geo.ui.Layer();

    this.model.bind("change:selected", this._onSwitchSelected, this);

    if (!this.options.template) this.options.template = this.defaults.template;

    // Template
    this.template = this.options.template_base ? cdb.templates.getTemplate(this.options.template_base) : _.template(this.options.template);

  },

  render: function() {

    this.$el.append(this.template(this.options))
    return this;

  },

  /*
  * Throw an event when the user clicks in the switch button
  */
  _onSwitchSelected: function() {

    var enabled = this.model.get('selected');

    this.$el.find(".switch")
    .removeClass(enabled ? 'disabled' : 'enabled')
    .addClass(enabled    ? 'enabled'  : 'disabled');

    this.trigger("switchChanged", enabled);

  },

  _onSwitchClick: function(e){

    e.preventDefault();
    e.stopPropagation();

    this.model.set("selected", !this.model.get("selected"));

  }

});

/**
* Collection of layers
*/
cdb.geo.ui.Layers = Backbone.Collection.extend({
  model: cdb.geo.ui.Layer
});

/**
* Layer selector: it allows to select the layers that will be shown in the map
*/
cdb.geo.ui.LayerSelector = cdb.core.View.extend({

  className: 'layer_selector_box',

  events: {
    "click":     '_openDropdown',
    "dblclick":  '_stopPropagation',
    "mousedown": '_stopPropagation'
  },

  initialize: function() {

    this.model = new cdb.core.Model({
      count: 0
    });

    this.model.bind("change:count", this._onCountChange, this);

  },

  render: function() {

    var self = this;
//debugger;

    this.$el.html(this.options.template(_.extend(this.model.toJSON(), this.options)));

    this.dropdown = new cdb.ui.common.Dropdown({
      className:" dropdown border",
      template_base: 'table/views/layer_dropdown',
      target: this.$el.find("a"),
      speedIn: 300,
      speedOut: 200,
      position: "position",
      tick: "right",
      vertical_position: "down",
      horizontal_position: "right",
      vertical_offset: 7,
      horizontal_offset: 13
    });

    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

    this.$el.append(this.dropdown.render().el);

    this.options.layers.each(function(l) {

      var layerView = new cdb.geo.ui.LayerView({
        name: l.get("name"),
        template_base: 'table/views/layer_item',
      }).bind("switchChanged", self.switchChanged, self);

      self.$el.find("ul").append(layerView.render().el);

    });


    return this;

  },

  switchChanged: function(e) {
    if (e) {
      this.model.set("count", this.model.get("count") + 1)
    }
    else this.model.set("count", this.model.get("count") - 1)
  },

  _onCountChange: function() {

    this.$el.find(".count").html(this.model.get("count"));

  },

  _stopPropagation: function(e) {
    e.preventDefault();
    e.stopPropagation();
  },

  _openDropdown: function() {
    this.dropdown.open();
  }

});
