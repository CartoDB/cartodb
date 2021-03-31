module Carto
  class AccountType < ActiveRecord::Base

    FREE = 'FREE'.freeze
    PERSONAL30 = 'PERSONAL30'.freeze
    INDIVIDUAL = 'Individual'.freeze
    FREE_2020 = 'Free 2020'.freeze

    TRIAL_PLANS = [FREE_2020].freeze
    TRIAL_DURATION = { FREE_2020 => 1.year }.freeze

    FULLSTORY_SUPPORTED_PLANS = [FREE, PERSONAL30, INDIVIDUAL, FREE_2020].freeze
    ENTERPRISE_PLANS = [
      'Cloud Engine & Enterprise Builder - Annual',
      'ENTERPRISE',
      'ENTERPRISE LUMP-SUM',
      'ENTERPRISE SMALL LS AWS',
      'Enterprise Builder - Annual',
      'Enterprise Large Lumpsum AWS',
      'Enterprise Large Lumpsum GCS',
      'Enterprise Small + Lumpsum AWS',
      'Enterprise Small + Lumpsum GCS',
      'Enterprise Small LS GCS',
      'Internal use engine - Cloud - Annual',
      'OEM engine - Cloud - Annual',
      'ORGANIZATION USER'
    ].freeze

    validates :rate_limit, presence: true

    belongs_to :rate_limit, dependent: :destroy

    def soft_geocoding_limit?(user)
      !!user[:soft_geocoding_limit]
    end

    def soft_here_isolines_limit?(user)
      !!user[:soft_here_isolines_limit]
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
