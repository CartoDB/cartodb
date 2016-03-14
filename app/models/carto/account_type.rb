# encoding: utf-8

module Carto
  class AccountType

    FREE = 'FREE'.freeze
    BASIC = 'BASIC'.freeze
    PRO = 'PRO'.freeze

    # Old plans
    MAGELLAN = 'MAGELLAN'.freeze

    NO_SOFT_GEOCODING_PLANS = 'ACADEMIC|Academy|Academic|INTERNAL|FREE|AMBASSADOR|ACADEMIC MAGELLAN|PARTNER|Magellan|ENTERPRISE|ORGANIZATION'.freeze

    NO_SOFT_GEOCODING_PLANS_REGEXP = /(#{NO_SOFT_GEOCODING_PLANS})/i

    NO_DEDICATED_SUPPORT_PLANS_REGEXP = /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i
    NO_REMOVE_LOGO_PLANS_REGEXP = /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i

    def pay_users
      ::User.where("upper(account_type) != '#{FREE}'").count
    end

    def dedicated_support?(user)
      NO_DEDICATED_SUPPORT_PLANS_REGEXP.match(user.account_type) ? false : true
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
  end
end
