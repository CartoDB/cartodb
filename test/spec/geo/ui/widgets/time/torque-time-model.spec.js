var TorqueLayerModel = require('cdb/geo/map/torque-layer');
var TorqueTimeModel = require('cdb/geo/ui/widgets/time/torque-time-model');
var sharedForTimeModel = require('./shared-for-time-model');

describe('geo/ui/widgets/time/time-torque-model', function() {
  beforeEach(function() {
    var endDate = new Date();
    this.torqueLayerModel = new TorqueLayerModel({
      // These values are expected to be provided from a torque layer (e.g. L.TorqueLayer)
      step: 1,
      steps: 100,
      timeBounds:  {
        start: endDate.getTime() - (1 * 24 * 60 * 60 * 1000),
        end: endDate.getTime()
      }
    });

    this.model = new TorqueTimeModel(undefined, {
      torqueLayerModel: this.torqueLayerModel
    });
  });

  sharedForTimeModel();
});
