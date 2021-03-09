module Carto::Limits
  def soft_geocoding_limit?
    Carto::AccountType.new.soft_geocoding_limit?(self)
  end
  alias_method :soft_geocoding_limit, :soft_geocoding_limit?

  def hard_geocoding_limit?
    !soft_geocoding_limit?
  end
  alias_method :hard_geocoding_limit, :hard_geocoding_limit?

  def soft_here_isolines_limit?
    Carto::AccountType.new.soft_here_isolines_limit?(self)
  end
  alias_method :soft_here_isolines_limit, :soft_here_isolines_limit?

  def hard_here_isolines_limit?
    !soft_here_isolines_limit?
  end
  alias_method :hard_here_isolines_limit, :hard_here_isolines_limit?

  def soft_twitter_datasource_limit?
    soft_twitter_datasource_limit == true
  end

  def hard_twitter_datasource_limit?
    !soft_twitter_datasource_limit?
  end
  alias_method :hard_twitter_datasource_limit, :hard_twitter_datasource_limit?

  def soft_mapzen_routing_limit?
    Carto::AccountType.new.soft_mapzen_routing_limit?(self)
  end
  alias_method :soft_mapzen_routing_limit, :soft_mapzen_routing_limit?

  def hard_mapzen_routing_limit?
    !soft_mapzen_routing_limit?
  end
  alias_method :hard_mapzen_routing_limit, :hard_mapzen_routing_limit?
end
