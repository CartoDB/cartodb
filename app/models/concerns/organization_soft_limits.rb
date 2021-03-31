module OrganizationSoftLimits

  extend ActiveSupport::Concern

  def soft_geocoding_limit?
    owner.try(:soft_geocoding_limit)
  end

  def soft_twitter_datasource_limit?
    owner.try(:soft_twitter_datasource_limit)
  end

  def soft_here_isolines_limit?
    owner.try(:soft_here_isolines_limit)
  end

  def soft_mapzen_routing_limit?
    owner.try(:soft_mapzen_routing_limit)
  end

  def db_size_in_bytes
    users.map(&:db_size_in_bytes).sum
  end

end
