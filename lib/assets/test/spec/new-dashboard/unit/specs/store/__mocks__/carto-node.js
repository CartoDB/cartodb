'use strict';
import visualization from '../../fixtures/visualizations';

const CartoNode = {};

class AuthenticatedClientMock {
  getConfig (callback) {
    const newConfig = {
      user_data: {
        email: 'example@carto.com',
        username: 'carto'
      }
    };

    callback(null, null, newConfig);
  }

  getVisualization (vizUrl, params, callback) {
    if (typeof params.order === 'boolean') {
      const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };
      callback(err, null, visualization);
    } else {
      callback(null, null, visualization);
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
