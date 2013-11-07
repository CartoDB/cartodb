  
  /**
   *  
   *
   */


  cdb.admin.StartNoTables = cdb.core.View.extend({

    events: {
      'click .play':    '_onClickPlay',
      'click ul li a':  '_onClickVideo'
    },

    _videos: {
      import: {
        url:'',
        img: ''
      },
      customize: {
        url:'',
        img: ''
      },
      publish: {
        url:'',
        img: ''
      },
    },

    
    initialize: function() {
      this.model = new cdb.core.Model({ option: 'import' });
    },


    ///////////////////
    // Change option //
    ///////////////////

    _onClickVideo: function(e) {
      e.preventDefault();
      var $a = $(e.target).closest('a');
      var href = $a.attr('href').replace(/#\//,'');
      this._goTo($a, href);
    },

    _onClickPlay: function(e) {
      e.preventDefault();
      // Add iframe
      this.$('.iframe')
        .html('VIDEO')
        .show();
    },

    _goTo: function($el, pos) {
      if (this.model.get('option') == pos) return false;

      this.model.set('option', pos);
      this._selectOption($el,pos);
      this._selectVideo($el,pos);
    },

    _selectOption: function($el, pos) {
      this.$('ul li a').each(function(i,a) {
        var href = $(a).attr('href').replace(/#\//,'');
        $(a)[href == pos ? 'addClass' : 'removeClass' ]('selected');
      })
    },

    _selectVideo: function($el, pos) {
      // Change image
      this.$('div.video img')
        .attr('src', this._videos[pos].url)
        .attr('title', pos)
        .attr('alt', pos);

      // Remove old video
      this.$('.iframe')
        .hide()
        .html('');
    },


    ////////////////////
    // View functions //
    ////////////////////

    activate: function() {
      this.$el.addClass('active')
    },

    deactivate: function() {
      this.$el.removeClass('active')
    }

  });