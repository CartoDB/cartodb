const defaultParams = {
  exclude_shared: false,
  per_page: 12,
  shared: 'no',
  locked: false,
  only_liked: false,
  types: 'derived',
  deepInsights: false
};

const mine = {
  ...defaultParams
};

const locked = {
  ...defaultParams,
  'locked': true
};

const shared = {
  ...defaultParams,
  'shared': 'only'
};

const favorited = {
  ...defaultParams,
  'only_liked': true
};

const publicPrivacy = {
  ...defaultParams,
  'privacy': 'public'
};

const linkPrivacy = {
  ...defaultParams,
  'privacy': 'link'
};

const passwordPrivacy = {
  ...defaultParams,
  'privacy': 'password'
};

const privatePrivacy = {
  ...defaultParams,
  'privacy': 'private'
};

const filters = {
  mine,
  locked,
  shared,
  favorited,
  public: publicPrivacy,
  privacy: linkPrivacy,
  password: passwordPrivacy,
  private: privatePrivacy
};

const allowedFilters = Object.keys(filters);

export default filters;

export { defaultParams };

export function isAllowed (filter) {
  return allowedFilters.includes(filter);
}
