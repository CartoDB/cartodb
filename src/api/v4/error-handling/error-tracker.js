/**
 * Use {@link http://docs.trackjs.com/tracker/top-level-api} for error logging.
 */
function track (error) {
  if (window.trackJs) {
    try {
      var message = error ? error.message + ' - code: ' + error.errorCode : JSON.stringify(error);
      window.trackJs.track(new Error(message));
    } catch (exc) {
      // Swallow
    }
  }
}

module.exports = {track: track};
