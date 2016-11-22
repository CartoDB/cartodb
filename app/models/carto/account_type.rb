# encoding: utf-8

module Carto
  class AccountType

    FREE = 'FREE'.freeze
    BASIC = 'BASIC'.freeze
    PRO = 'PRO'.freeze

    # Old plans
    MAGELLAN = 'MAGELLAN'.freeze

    NO_SOFT_GEOCODING_PLANS = 'ACADEMIC|ACADEMY|INTERNAL|FREE|AMBASSADOR|PARTNER|MAGELLAN|ENTERPRISE|ORGANIZATION'.freeze

    NO_SOFT_GEOCODING_PLANS_REGEXP = /(#{NO_SOFT_GEOCODING_PLANS})/i

    NO_REMOVE_LOGO_PLANS_REGEXP = /^(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD|SITE LICENSE)/i

    def pay_users
      ::User.where("upper(account_type) != '#{FREE}'").count
    end

    def remove_logo?(user)
      NO_REMOVE_LOGO_PLANS_REGEXP.match(user.account_type) ? false : true
    end

    def soft_geocoding_limit?(user)
      if user[:soft_geocoding_limit].nil?
        !(user.account_type.nil? || user.account_type =~ NO_SOFT_GEOCODING_PLANS_REGEXP)
      else
        user[:soft_geocoding_limit]
      end
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
  end
end
