# encoding: utf-8

module Carto
  class AccountType

    FREE = 'FREE'
    MAGELLAN = 'MAGELLAN'

    def pay_users
      return ::User.where("upper(account_type) != '#{FREE}'").count
    end

    def dedicated_support?(user)
      /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i.match(user.account_type) ? false : true
    end

    def remove_logo?(user)
      /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i.match(user.account_type) ? false : true
    end

    def soft_geocoding_limit?(user)
      if user[:soft_geocoding_limit].nil?
        plan_list = "ACADEMIC|Academy|Academic|INTERNAL|FREE|AMBASSADOR|ACADEMIC MAGELLAN|PARTNER|FREE|Magellan|Academy|ACADEMIC|AMBASSADOR"
        (user.account_type =~ /(#{plan_list})/ ? false : true)
      else
        user[:soft_geocoding_limit]
      end
    end
  end
end
