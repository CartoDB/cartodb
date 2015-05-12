
/**
 * use as global hotkey watcher:
 *
 * cdb.god.bind('hotkey:s', function() ...
 */

cdb.admin.hotkeys = {

  _keyMap: {
    68: 's',
    67: 'c',
    83: 's'
  },

  enable: function() {
    $('body').bind('keydown', function(e) {
      if(e.altKey && e.ctrlKey) {
        var evt = cdb.admin.hotkeys._keyMap[e.keyCode];
        if(evt) {
          cdb.god.trigger('hotkey:' + evt, e);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    });
  }
};
