
cdb.admin.EditInPlace = cdb.core.View.extend({

  events: {
    "click .value": "_onClick",
    "keyup input": "_onKeyPress",
    "blur input": "_cancel"
  },

  initialize: function() {

    this._observedField = this.options.observe;

    this.template = this.options.template_name ? this.getTemplate(this.options.template_name) : this.getTemplate('table/menu_modules/legends/views/edit_in_place');

    this.add_related_model(this.model);
    this.model.bind("change:" + this._observedField, this._updateValue, this);

    this.render();

  },

  _updateValue: function() {

    var value = this.model.get(this._observedField);

    this.$el.find("input").text(value);
    this.$el.find(".value").html(value);
    this.trigger("change", value, this);

  },

  _cancel: function(e) {
    e && e.preventDefault();
    e && e.stopPropagation();

    this.$el.find(".value").show();
    this.$el.find(".bg").show();
    this.$el.find("input").hide();
  },

  _onKeyPress: function(e) {

    if (e.keyCode == 13) { // Enter

      this.model.set(this._observedField, this.$el.find("input").val());

      this.$el.find(".value").show();
      this.$el.find(".bg").show();
      this.$el.find("input").hide();
    } else if (e.keyCode == 27) { // Esc
      this._cancel();
    }

  },

  _onClick: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

    this.$el.find(".value").hide();
    this.$el.find(".bg").hide();
    this.$el.find("input").show();
    this.$el.find("input").focus();

  },

  render: function() {

    var value = this.model.get(this._observedField);

    this.$el.append(this.template({ value: value }));
    this.$el.addClass("edit_in_place");

    this.$el.append('<div class="bg"></div>');
    this.$el.append('<input type="text" value="' + value + '" />');

  }

});

