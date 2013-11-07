
  /**
   *  Dialog to edit the fields of a feature from the map
   */

  cdb.admin.EditFeatureFields = cdb.admin.BaseDialog.extend({

    editorField: {
      'date':                         cdb.admin.DateField,
      'number':                       cdb.admin.NumberField,
      'boolean':                      cdb.admin.BooleanField,
      'geometry':                     cdb.admin.GeometryField,
      'timestamp with time zone':     cdb.admin.DateField,
      'timestamp without time zone':  cdb.admin.DateField,
      'string':                       cdb.admin.StringField
    },

    initialize: function() {
      _.defaults(this.options, {
        title: 'Edit fields',
        width: 450,
        ok_title: 'Save and close',
        ok_button_classes: 'button grey',
        cancel_title: '',
        clean_on_hide: true,
        enter_to_confirm: false,
        modal_type: 'creation',
        modal_class: 'edit_fields_dialog',
        include_footer: true
      })

      cdb.admin.BaseDialog.prototype.initialize.apply(this);
    },

    /**
     *  Render content
     */
    render_content: function() {

      var $content      = $('<div>').addClass('edit_content')
        , $wrapper      = $('<div>').addClass('wrapper')
        , self          = this
        , schema        = this.options.table.get('schema')
        , hiddenColumns = this.options.table.hiddenColumns;


      // sort by keys
      var keys = _.keys(this.model.attributes);
      keys.sort();
      _.each(keys, function(attr) {
        var val = self.model.get(attr);
        if (!_.contains(hiddenColumns, attr) && !_.isFunction(val)) {
          // Get column type
          var columType = self.options.table.getColumnType(attr);
          var editor_field = self.editorField[columType] || self.editorField['string'];

          // Create subview
          var subView = new editor_field({
            label: true,
            readOnly: false,
            model: new cdb.core.Model({
              attribute:  attr,
              value:      val
            })
          }).bind('ENTER', function(e) {
            this._ok();
          }, self)

          // Add to content
          $wrapper.append(subView.render().el);

          // Add subview to this view (cleaning purposes)
          self.addView(subView);
        }
      });

      // Custom scroll code (showing gradients at the end and beginning of the content)
      var scroll = new cdb.admin.CustomScrolls({
        parent: $content,
        el:     $wrapper
      });

      this.addView(scroll);

      $content.append($wrapper);

      return $content;
    },

    _scrollToError: function() {
      // Get first error view
      var error_v = _.find(this._subviews, function(v) { return !v.isValid()});

      if (error_v) {
        var $el = error_v.$el;
        var $wrapper = this.$('.wrapper');

        $wrapper.stop().animate({ scrollTop: $el.offset().top -  $wrapper.offset().top +  $wrapper.scrollTop() }, 250);
      }

    },

    _isFormValid: function() {
      for (var view in this._subviews) {
        var v = this._subviews[view];
        if (v.model && !v.isValid())
          return false;
      }
      return true;
    },

    _ok: function(ev) {
      if(ev) ev.preventDefault();

      if (!this._isFormValid()) {
        this._scrollToError();
        return false;
      }

      if (this.ok) {
        this.ok();
      }

      this.hide();
    },

    ok: function() {
      // Get values from the subviews
      var new_model = {};
      _(this._subviews).each(function(v) {
        if (v.model)
          new_model[v.model.get("attribute")] = v.model.get("value");
      });

      if (this.options.res)
        this.options.res(new_model);
    }
  });
