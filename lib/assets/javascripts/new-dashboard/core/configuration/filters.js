const defaultParams = {
  exclude_shared: false,
  per_page: 12,
  shared: 'no',
  locked: false,
  only_liked: false,
  deepInsights: false,
  types: 'derived,kuviz'
};

const mine = {
  ...defaultParams
};

const both = {
  ...defaultParams,
  shared: 'yes'
};

const locked = {
  ...defaultParams,
  locked: true
};

const shared = {
  ...defaultParams,
  shared: 'only'
};

const favorited = {
  ...defaultParams,
  only_liked: true
};

const subscribed = {
  ...defaultParams,
  subscribed: true
};

const sample = {
  ...defaultParams,
  sample: true
};

const publicPrivacy = {
  ...defaultParams,
  privacy: 'public'
};

const linkPrivacy = {
  ...defaultParams,
  privacy: 'link'
};

const passwordPrivacy = {
  ...defaultParams,
  privacy: 'password'
};

const privatePrivacy = {
  ...defaultParams,
  privacy: 'private'
};

const derivedType = {
  ...defaultParams,
  types: 'derived'
};

const kuvizType = {
  ...defaultParams,
  types: 'kuviz'
};

const externalType = {
  ...defaultParams
};

const filters = {
  mine,
  locked,
  shared,
  both,
  favorited,
  subscribed,
  sample,
  public: publicPrivacy,
  link: linkPrivacy,
  password: passwordPrivacy,
  private: privatePrivacy,
  builder: derivedType,
  cartoframes: kuvizType,
  external: externalType
};

const allowedFilters = Object.keys(filters);

export default filters;

export { defaultParams };

export function isAllowed (filter) {
  return allowedFilters.includes(filter);
}
