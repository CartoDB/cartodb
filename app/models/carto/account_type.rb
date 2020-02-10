module Carto
  class AccountType < ActiveRecord::Base

    FREE = 'FREE'.freeze
    PERSONAL30 = 'PERSONAL30'.freeze
    INDIVIDUAL = 'Individual'.freeze

    TRIAL_PLANS = [PERSONAL30, INDIVIDUAL].freeze
    TRIAL_DAYS = { PERSONAL30 => 30, INDIVIDUAL => 14 }.freeze

    FULLSTORY_SUPPORTED_PLANS = [FREE, PERSONAL30, INDIVIDUAL].freeze

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
