export function hasFeatureEnabled (user = {}, featureName) {
  if (!user.feature_flags) {
    return false;
  }

  return user.feature_flags.indexOf(featureName) > -1;
}
