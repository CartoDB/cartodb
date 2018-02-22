var track = function (error) {
  if (window.trackJs) {
    window.trackJs.track(error);
  }
};

module.exports = track;
