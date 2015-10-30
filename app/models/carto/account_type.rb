# encoding: utf-8

module Carto
  class AccountType

    FREE = 'FREE'
    MAGELLAN = 'MAGELLAN'

    SOFT_GEOCODING_PLANS = "ACADEMIC|Academy|Academic|INTERNAL|FREE|AMBASSADOR|ACADEMIC MAGELLAN|PARTNER|FREE|Magellan|Academy|ACADEMIC|AMBASSADOR"
    SOFT_GEOCODING_PLANS_REGEXP = /(#{SOFT_GEOCODING_PLANS})/

    DEDICATED_SUPPORT_PLANS_REGEXP = /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i
    REMOVE_LOGO_PLANS_REGEXP = /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i

    def pay_users
      ::User.where("upper(account_type) != '#{FREE}'").count
    end

    def dedicated_support?(user)
      DEDICATED_SUPPORT_PLANS_REGEXP.match(user.account_type) ? false : true
    end

    def remove_logo?(user)
      REMOVE_LOGO_PLANS_REGEXP.match(user.account_type) ? false : true
    end

    def soft_geocoding_limit?(user)
      if user[:soft_geocoding_limit].nil?
        (user.account_type =~ SOFT_GEOCODING_PLANS_REGEXP ? false : true)
      else
        user[:soft_geocoding_limit]
      end
    end
  end
end
