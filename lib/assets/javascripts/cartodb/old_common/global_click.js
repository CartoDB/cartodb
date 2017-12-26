
/**
 * enables a catch all for clicks to send singal in godbus to close all dialogs
 */

function enableClickOut(el) {
  el.click(function() {
    cdb.god.trigger("closeDialogs");
  });
}
