'use strict';
import visualization from '../../fixtures/visualizations';
import datasets from '../../fixtures/datasets';
import toObject from 'new-dashboard/utils/to-object';

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
    let data = visualization;
    if (params.types === 'table') {
      data = datasets;
    }
    if (typeof params.order === 'boolean') {
      const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };
      callback(err, null, null);
    } else {
      callback(null, null, data);
    }
  }

  like (itemId, callback) {
    const item = getItem(itemId);
    if (item.liked === true) {
      const err = "You've already liked this visualization";
      callback(err, null, {
        id: itemId,
        likes: item.likes,
        liked: true});
    } else {
      callback(null, null, {
        id: itemId,
        likes: item.likes + 1,
        liked: true});
    }
  }

  deleteLike (itemId, callback) {
    const item = getItem(itemId);
    if (item.liked === true) {
      callback(null, null, {
        id: itemId,
        likes: item.likes - 1,
        liked: item.liked });
    } else {
      callback(null, null, {
        id: itemId,
        likes: item.likes,
        liked: item.liked });
    }
  }
}

function getItem (itemId) {
  const items = {
    ...toObject(visualization.visualizations, 'id'),
    ...toObject(datasets.visualizations, 'id')
  };
  return items[itemId];
}

CartoNode.AuthenticatedClient = AuthenticatedClientMock;

export default CartoNode;
