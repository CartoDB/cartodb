  
  /**
   *  Custom combo which it lets you to add a custom value
   *
   */
  

  cdb.forms.CustomTextCombo = cdb.forms.Combo.extend({

    className: 'form_combo form_custom_text_combo',

    options: {
      minimumResultsForSearch: 20,
      placeholder: '',
      formatResult: false,
      matcher: false,
      freeText: true,
      dropdownCssClass: 'custom_text_combo'
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

        if (this.options.formatResult)
          combo_options.formatResult = this._formatResult;

        if (this.options.matcher)
          combo_options.matcher = this._matcher;

        $select.select2(combo_options);
      }

      return this;
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

    _changeSelection: function(e) {
      var a = {};

      var val = this.$('select').data('select2').data().text;
      
      // Check if val is from text or value
      var isText = _.contains(this.options.extra, val);

      a[this.options.property] = val;
      a['text'] = isText ? true : false;

      // if (this.model) {
        if (val) this.model.set(a);
      //   else this.model.set(a, { silent: true });
      // }

      // Send trigger
      // if (val) this.trigger('change', a[this.options.property]);
    }

  });