
cdb.admin.EditInPlace = cdb.core.View.extend({

  events: {
    "click .value": "_onClick",
    "keyup input":  "_onKeyUp",
    "blur input":   "_close"
  },

  initialize: function() {

    _.bindAll(this, "_close", "_onKeyUp");

    this._observedField = this.options.observe;

    this.template = this.options.template_name ? this.getTemplate(this.options.template_name) : this.getTemplate('table/menu_modules/legends/views/edit_in_place');

    this._setupConfig();

    this.add_related_model(this.model);
    this.model.bind("change:" + this._observedField, this._updateValue, this);

    this.render();

  },

  _setupConfig: function() {

    this.config = new cdb.core.Model({
      mode: "view"
    });

    this.add_related_model(this.config);
    this.config.bind("change:mode", this._updateMode, this);

  },

  _updateMode: function(mode) {

    if (this.config.get("mode") == 'edit') {

      this.$el.find(".value").hide();
      this.$el.find(".bg").hide();

      this.$input.show();
      this.$input.focus();

    } else {

      this.$el.find(".value").show();
      this.$el.find(".bg").show();
      this.$input.hide();

    }
  },

  _updateValue: function() {

    var value = this.model.get(this._observedField);

    this.$input.text(value);
    this.$el.find(".value").html(value);

    this.trigger("change", value, this);

  },

  _close: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

    this.config.set("mode", "view");

  },

  _onKeyUp: function(e) {

    if (e.keyCode == 13) { // Enter

      this.model.set(this._observedField, this.$el.find("input").val());
      this._close();

    } else if (e.keyCode == 27) { // Esc
      this._close();
    }

  },

  _onClick: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

    this.config.set("mode", "edit");
  },

  render: function() {

    var value = this.model.get(this._observedField);

    this.$el.append(this.template({ value: value }));
    this.$el.addClass("edit_in_place");

    this.$el.append('<div class="bg"></div>');
    this.$el.append('<input type="text" value="' + value + '" />');

    this.$input = this.$el.find("input");

  }

});
