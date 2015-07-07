var cdb = require('cartodb.js');

/**
 *  Combo for templated workflows
 *
 *  - It supports ajax results.
 *
 */



module.exports = cdb.core.View.extend({

  className: 'form-view form_combo',

  options: {
    minimumResultsForSearch: 20,
    placeholder: '',
    formatResult: false,
    formatSelection: false,
    matcher: false,
    dropdownCssClass: ''
  },

  events: {
    'change select': '_changeSelection'
  },

  initialize: function() {
    _.bindAll(this, "_onUpdate", "_changeSelection");

    this.data = this.options.extra;


    if (this.model) {
      this.add_related_model(this.model);
      this.model.bind("change:" + this.options.property, this._onUpdate, this);
    }
  },

  render: function() {

    var self = this;

    // Options
    this.$select = $('<select>' + this._getOptions() + '</select>');

    // Method
    var method = this.model && this.model.get("method") && this.model.get("method").replace(/ /g,"_").toLowerCase();

    // Attributes
    this.$select.attr({
      style: (this.options.width ? "width:" + this.options.width  : '')
    });

    this.$select.addClass(this.options.property + (method ? ' ' + method : ''));

    // Disabled?
    if (this.options.disabled) this.$select.attr("disabled", '');

    // Sets the value
    this._setValue(this.model && this.model.get(this.options.property) || this.options.property);

    // Append
    this.$el.html(this.$select);

    // Apply select2, but before destroy the bindings
    if (!this.options || !this.options.plainSelect) {

      var $select = this.$("select");
      $select.select2("destroy");

      var combo_options = {
        minimumResultsForSearch:  this.options.minimumResultsForSearch,
        placeholder:              this.options.placeholder,
        dropdownCssClass:         this.options.dropdownCssClass
      };

      if (this.options.formatResult)
        combo_options.formatResult = this._formatResult;

      if (this.options.formatSelection)
        combo_options.formatSelection = this._formatSelection;

      if (this.options.matcher)
        combo_options.matcher = this._matcher;

      if (this.options.query && !this.data) {    
        var sql = new cartodb.SQL({
          user: user_data.username,
          api_key: user_data.api_key,
          sql_api_template: cdb.config.get('sql_api_template')
        });
        sql.execute(this.options.query).done(function(data){
          self.updateData(_.pluck(data.rows, 'cartodb_id'))
        });
      }

      $select.select2(combo_options);
    }

    return this;
  },

  deselect: function() {
    this.$("select").val("").change();
  },

  updateData: function(data) {
    this.data = data;
    this._onUpdate();
  },

  _onUpdate: function() {
    this.render();
  },

  _getOptions: function() {
    var options = _.map(this.data, function(option) {

      if (_.isArray(option)) {
        return '<option value="' + option[1] + '">' + option[0] + '</option>';
      } else {
        return '<option>' + option + '</option>';
      }

    }).join("");

    if (this.options.placeholder) options = "<option></option>" + options;

    return options;
  },

  _setValue: function(value) {
    this.$select.val(value);
  },

  _changeSelection: function(e) {
    var a = {};

    var val = this.$('select').val();

    a[this.options.property] = val;

    if (this.model) {
      if (val) this.model.set(a);
      else this.model.set(a, { silent: true });
    }

    // Send trigger
    if (val) this.trigger('change', a[this.options.property]);
  },

  _formatResult: function(data) {
    return data.id || data.text;
  },

  _matcher: function(term, text, option) {
    return text.toUpperCase().indexOf(term.toUpperCase())>=0;
  },

  clean: function() {
    this.$select.select2("destroy");
    cdb.core.View.prototype.clean.call(this);
  }

});