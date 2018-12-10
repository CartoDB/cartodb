import CartoNode from 'carto-node';
import FILTERS, {
  isAllowed
} from 'new-dashboard/core/filters';

const client = new CartoNode.AuthenticatedClient();

const DEFAULT_PAGE = 1;
const DEFAULT_ORDER_OPTS = {
  order: 'updated_at',
  direction: 'asc'
};
const DEFAULT_FILTER = 'mine';

const DEFAULT_PARAMETERS = {
  page: DEFAULT_PAGE,
  orderOpts: DEFAULT_ORDER_OPTS,
  filter: DEFAULT_FILTER
};

/**
 * 
 * @param {Number} page Results page to get the data from.
 * @param {Object} orderOpts 
 * @param {string} orderOpts.order Specify the results order criteria. Values: "updated_at"|"name"|"mapviews".
 * @param {string} orderOpts.direction The direction in which the order criteria will be applied. Values: "asc"|"desc".
 * @param {string} filter Filter to be applied. Values: "updated_at"|"name"|"mapviews"
 */
export function fetchMaps ({page = DEFAULT_PAGE, orderOpts = DEFAULT_ORDER_OPTS, filter = DEFAULT_FILTER} = DEFAULT_PARAMETERS) {
  const params = _buildSearchParameters(page, orderOpts, filter);
  return new Promise(function (resolve, reject) {
    client.getVisualization('', params, (err, _, data) => err ? reject(err) : resolve(data));
  });
}

function _buildSearchParameters (page, orderOpts, filter) {
  _validateSearchParameters(page, orderOpts, filter);
  return {
    page,
    types: 'derived',
    order: orderOpts.order,
    order_direction: orderOpts.direction,
    ...FILTERS[filter]
  };
}

function _validateSearchParameters (page, orderOpts, filter) {
  if (typeof page !== 'number') {
    throw new TypeError(`"page" must be a numeric value but received' ${page}`);
  }
  if (!isAllowed(filter)) {
    throw new TypeError(`"filter" must be one of the following: "updated_at"|"name"|"mapviews" but we got ${filter}`);
  }
}

export default {
  fetchMaps
};
