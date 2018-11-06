'use strict';
import visualization from '../../fixtures/visualizations';
import datasets from '../../fixtures/datasets';

const CartoNode = {};

class AuthenticatedClientMock {
  getVisualization (vizUrl, params, callback) {
    let data = visualization;
    if (params.types === 'table') {
      data = datasets;
    }
    if (typeof params.order === 'boolean') {
      const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };
      callback(err, null, data);
    } else {
      callback(null, null, data);
    }
  }

  likeMap (mapId, callback) {
    const map = visualization.visualizations.find(v => v.id === mapId);
    if (map.liked === true) {
      const err = "You've already liked this visualization";
      callback(err, null, {
        id: mapId,
        likes: map.likes,
        liked: true});
    } else {
      callback(null, null, {
        id: mapId,
        likes: map.likes + 1,
        liked: true});
    }
  }

  deleteLikeMap (mapId, callback) {
    const map = visualization.visualizations.find(v => v.id === mapId);
    if (map.liked === true) {
      callback(null, null, {
        id: mapId,
        likes: map.likes - 1,
        liked: map.liked });
    } else {
      callback(null, null, {
        id: mapId,
        likes: map.likes,
        liked: map.liked });
    }
  }
}

CartoNode.AuthenticatedClient = AuthenticatedClientMock;

export default CartoNode;
