
  /**
   *  
   *
   *
   */


  cdb.admin.CommonData.Table = cdb.core.View.extend({

    tagName: 'li',

    initialize: function() {
      this.template = cdb.templates.getTemplate('common_data/views/common_data_table');
    },

    render: function() {
      this.$el.empty();

      var d = {
        name:         this.model.get('title') || this.model.get('name'),
        description:  this.model.get('description'),
        source:       this.model.get('source'),
        license:      this.model.get('license'),
        size:         this.model.get('table') && this.model.get('table').size && this._bytesToSize(this.model.get('table').size),
        row_count:    this.model.get('table') && this.model.get('table').row_count && cdb.Utils.formatNumber(this.model.get('table').row_count),
        url:          ''
      }

      this.$el.append(this.template( d ));

      return this;
    },

    // Help functions
    _bytesToSize: function(by) {
      var bytes = parseInt(by.toString())
      , sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes == 0) return '0 KB';
      var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      var value = (bytes / Math.pow(1024, i)).toFixed(2);

      if (value % 1 == 0) {
        value = parseInt(value)
      }
      return value + " " + sizes[i];
    },

  });