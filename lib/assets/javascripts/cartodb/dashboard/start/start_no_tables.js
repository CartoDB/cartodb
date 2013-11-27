  
  /**
   *  Dashboard welcome when there is no tables in
   *  user account.
   *
   *  - It doesn't need any model.
   *  - It just plays showing some videos.
   *
   *  new cdb.admin.StartNoTables({ el: $('wherever') })
   */


  cdb.admin.StartNoTables = cdb.core.View.extend({

    events: {
      'click ul li a':  '_onClickVideo'
    },

    _videos: {
      import: {
        url:'80472124'
      },
      customize: {
        url:'80472012'
      },
      publish: {
        url:'80472123'
      },
    },

    template: '<iframe id="video" src="https://player.vimeo.com/video/<%= url %>?api=1&amp;player_id=video" width="100%" height="100%" frameborder="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen=""></iframe>',

    initialize: function() {
      this.model = new cdb.core.Model({ option: 'import' });
      this._selectVideo('import');
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

    _goTo: function($el, pos) {
      if (this.model.get('option') == pos) return false;

      this.model.set('option', pos);
      this._selectOption($el,pos);
      this._selectVideo(pos);
    },

    _selectOption: function($el, pos) {
      this.$('ul li a').each(function(i,a) {
        var href = $(a).attr('href').replace(/#\//,'');
        $(a)[href == pos ? 'addClass' : 'removeClass' ]('selected');
      })
    },

    _selectVideo: function(pos) {
      // Remove old video
      this.$('.iframe')
        .html(_.template(this.template)({ url: this._videos[pos].url }))
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