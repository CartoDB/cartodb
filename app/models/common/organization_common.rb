module Carto::OrganizationSoftLimits
  def soft_geocoding_limit?
    owner.try(:soft_geocoding_limit)
  end

  def soft_twitter_datasource_limit?
    owner.try(:soft_twitter_datasource_limit)
  end

  def soft_here_isolines_limit?
    owner.try(:soft_here_isolines_limit)
  end

  def soft_obs_snapshot_limit?
    owner.try(:soft_obs_snapshot_limit)
  end

  def soft_obs_general_limit?
    owner.try(:soft_obs_general_limit)
  end

  def soft_mapzen_routing_limit?
    owner.try(:soft_mapzen_routing_limit)
  end
end
