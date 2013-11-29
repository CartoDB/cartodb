
cdb.admin.EditInPlace = cdb.core.View.extend({

  events: {
    "click .value": "_onClick",
    "keyup input":  "_onKeyUp",
    "blur input":   "_onBlur"
  },

  initialize: function() {

    this.options = _.extend({
      disabled: false,
      stripHTML: false
    }, this.options);

    _.bindAll(this, "_close", "_onKeyUp");

    this._observedField = this.options.observe;

    this.disabled  = this.options.disabled;
    this.stripHTML = this.options.stripHTML;

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

      this.$input.show();
      this.$input.focus();

    } else {

      this.$el.find(".value").show();
      this.$input.hide();

      var value = this.model.get(this._observedField);

      this.$input.val(value);
      this.$el.find(".value span").html(value);

    }
  },

  _updateValue: function() {

    var value = this.model.get(this._observedField);

    if (this.stripHTML) {
      value = cdb.Utils.stripHTML(value);
    }

    if (cdb.Utils.isBlank(value)) {

      this.$input.text("");
      this.$el.find(".value").addClass("empty");
      this.$el.find(".value span").text("empty");
      this.trigger("change", null, this);

      return;
    }

    this.$input.text(value);
    this.$el.find(".value span").html(value);
    this.$el.find(".value").removeClass("empty");

    this.trigger("change", value, this);

  },

  _close: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

    this.config.set("mode", "view");

    this._preventEmptyValue();
  },

  _preventEmptyValue: function() {

    var value = this.model.get(this._observedField);

    if (cdb.Utils.isBlank(value)) {
      this.$el.find(".value").addClass("empty");
      this.$el.find(".value span").text("empty");
    } else {
      this.$el.find(".value").removeClass("empty");
    }

  },

  _onBlur: function(e) {

    var value = this.$el.find("input").val();

    if (this.stripHTML) {
      value = cdb.Utils.stripHTML(value);
    }

    this.model.set(this._observedField, value);
    this._close();
  },

  _onKeyUp: function(e) {

    if (e.keyCode == 13) { // Enter

      var value = this.$el.find("input").val();

      if (this.stripHTML) {
        value = cdb.Utils.stripHTML(value);
      }

      this.model.set(this._observedField, value);
      this._close();

    } else if (e.keyCode == 27) { // Esc
      this._close();
    }

  },

  _onClick: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

    if (!this.disabled) this.config.set("mode", "edit");
  },

  render: function() {

    var isEmpty = true;
    var value = this.model.get(this._observedField);

    if (this.stripHTML) {
      value = cdb.Utils.stripHTML(value);
    }

    if (cdb.Utils.isBlank(value)) {
      value = "empty";
      this.$el.append('<input type="text" value="" />');
    } else {
      isEmpty = false;
      this.$el.append('<input type="text" value="' + value + '" />');
    }

    this.$el.append(this.template({ value: value }));
    this.$el.addClass("edit_in_place");

    if (this.disabled) this.$el.addClass("disabled");

    if (isEmpty) {
      this.$el.find(".value").addClass("empty");
    } else {
      this.$el.find(".value").removeClass("empty");
    }

    this.$input = this.$el.find("input");

    if (this.options.maxWidth) this.$el.find("span").css("max-width", this.options.maxWidth);


  }

});
