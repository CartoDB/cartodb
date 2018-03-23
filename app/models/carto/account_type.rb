# encoding: utf-8

module Carto
  class AccountType < ActiveRecord::Base

    belongs_to :rate_limit, dependent: :destroy

    def soft_geocoding_limit?(user)
      !!user[:soft_geocoding_limit]
    end

    def soft_here_isolines_limit?(user)
      !!user[:soft_here_isolines_limit]
    end

    def soft_obs_snapshot_limit?(user)
      !!user[:soft_obs_snapshot_limit]
    end

    def soft_obs_general_limit?(user)
      !!user[:soft_obs_general_limit]
    end

    def soft_mapzen_routing_limit?(user)
      !!user[:soft_mapzen_routing_limit]
    end

    def mailchimp?(_user)
      # Mailchimp is currently not supported
      false
    end
  end
end
