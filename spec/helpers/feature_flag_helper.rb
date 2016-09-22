module FeatureFlagHelper
  def set_feature_flag(user, feature, state)
    user.reload
    previous_state = user.has_feature_flag?(feature)
    if state != previous_state
      ff = FeatureFlag[name: feature]
      ffu = FeatureFlagsUser[feature_flag_id: ff.id, user_id: user.id]
      if state
        unless ffu
          FeatureFlagsUser.new(feature_flag_id: ff.id, user_id: user.id).save
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
