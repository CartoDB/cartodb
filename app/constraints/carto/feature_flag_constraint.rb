# TODO: this is not used for the moment because it should be used in routes file but it breaks reloading.
class Carto::FeatureFlagConstraint

  def initialize(feature_flag)
    @feature_flag = feature_flag
  end

  def matches?(request)
    user = Carto::User.where(username: CartoDB.extract_subdomain(request)).first
    user && user.has_feature_flag?(@feature_flag)
  end
end

