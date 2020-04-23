export function hasFeatureEnabled (user, featureName) {
  return user.feature_flags.indexOf(featureName) > -1;
}
