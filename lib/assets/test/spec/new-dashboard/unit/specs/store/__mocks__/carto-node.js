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

  likeMap (params, callback) {
    if (params.liked === true) {
      const err = "You've already liked this visualization";
      callback(err, null, {
        id: params.id,
        likes: params.likes,
        liked: params.liked});
    } else {
      callback(null, null, {
        id: params.id,
        likes: 1,
        liked: true});
    }
  }

  deleteLikeMap (params, callback) {
    if (params.liked === true) {
      callback(null, null, {});
    } else {
      callback(null, null, {
        id: params.id,
        likes: 0,
        liked: false });
    }
  }
}

CartoNode.AuthenticatedClient = AuthenticatedClientMock;

export default CartoNode;
