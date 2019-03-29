  
  /**
   *  Custom combo which it lets you to add a custom value
   *  extended from filters combo.
   *
   */
  

  cdb.forms.CustomTextCombo = cdb.forms.ColumnTypeCombo.extend({

    className: 'form_combo form_custom_text_combo',

    options: {
      minimumResultsForSearch: 20,
      placeholder: '',
      formatResult: true,
      formatSelection: true,
      matcher: true,
      freeText: true,
      dropdownCssClass: 'column-type custom_text_combo'
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
          dropdownCssClass:         this.options.dropdownCssClass,
          freeText:                 this.options.freeText
        };

        if (this.options.formatSelection)
          combo_options.formatSelection = this._formatSelection;

        if (this.options.formatResult)
          combo_options.formatResult = this._formatResult;

        if (this.options.matcher)
          combo_options.matcher = this._matcher;

        $select.select2(combo_options);
      }

      // Set value for the combo if it is not defined as an option
      var actual_value = this.model.get(this.options.property);
      if ( actual_value !== "" && !this._valueAsOption(this.model.get(this.options.property))) {
        $select.select2('val', this.model.get(this.options.property))
      }

      return this;
    },

    // Does that value exist as an option?
    _valueAsOption: function(value) {
      return _.find(this.options.extra, function(opt) { return opt[1] === value }) !== undefined
    },

    _formatSelection: function(data) {
      return data ? data.id : data.text;
    },

    _changeSelection: function(e) {
      var val = this.$('select').val() || this.$('select').data('select2').data().id;
      // Check if val is from text or value
      var isText = !this._valueAsOption(val);

      // Set model
      var a = {};
      a[this.options.property] = val;
      a[this.options.text || 'text'] = isText ? true : false;

      if (val) this.model.set(a);

      // Set icon
      this.$('.select2-choice > div')
        .removeClass()
        .addClass( isText ? 'free-text-icon' : 'combo-option-icon' )
    }

  });