'use strict';
import visualization from '../maps/fixtures/visualizations';

const CartoNode = {};

class AuthenticatedClientMock {
  getVisualization (vizUrl, params, callback) {
    if (typeof params.order === 'boolean') {
      const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };
      callback(err, null, visualization);
    } else {
      callback(null, null, visualization);
    }
  }
}

CartoNode.AuthenticatedClient = AuthenticatedClientMock;

export default CartoNode;
