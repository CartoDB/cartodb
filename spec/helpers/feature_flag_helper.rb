module FeatureFlagHelper
  def set_feature_flag(user, feature, state)
    user = user.carto_user

    previous_state = user.has_feature_flag?(feature)
    if state != previous_state
      ff = Carto::FeatureFlag.find_by(name: feature)
      ffu = Carto::FeatureFlagsUser.find_by(feature_flag: ff, user: user)
      if state
        unless ffu
          user.activate_feature_flag!(ff)
        end
      else
        ff.update restricted: false unless ff.restricted
        ffu.delete if ffu
      end
      user.reload
    end
    previous_state
  end

  def with_feature_flag(user, feature, state)
    user.reload
    previous_state = set_feature_flag user, feature, state
    yield
    set_feature_flag user, feature, previous_state if state != previous_state
  end
end
