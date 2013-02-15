
  /**
   *  Dialog to edit the fields of a feature from the map
   */

   /*
    
    TODO:
      - Geometry editor
      - Tests
      - Change old editors for those new ones.
      - Remove old tests
   */


  cdb.admin.EditFeatureFields = cdb.admin.BaseDialog.extend({

    editTypeFields: {
      'date':     'Date',
      'number':   'Number',
      'boolean':  'Boolean',
      'geometry': 'String',
      'string':   'String'
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


      _.each(this.model.attributes,function(val,attr){
        if (!_.contains(hiddenColumns,attr)) {
          // Get column type
          var type = _.find(schema, function(arr,i){
            return attr == arr[0]
          })[1];

          // Create subview
          var subView = new cdb.admin[self.editTypeFields[type] + 'Field']({
            label: true,
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

    ok: function() {
      // Get values from the subviews
      var new_model = {};
      _(this._subviews).each(function(v) {
        if (v.model && v.model.get('value'))
          new_model[v.model.get("attribute")] = v.model.get("value");
      });

      // Set row model
      this.model.save(new_model);
    }
  });
