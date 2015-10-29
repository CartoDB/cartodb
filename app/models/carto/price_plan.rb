# encoding: utf-8

module Carto
  class PricePlan

    FREE = 'FREE'
    MAGELLAN = 'MAGELLAN'

    def pay_users
      return ::User.where("upper(account_type) != '#{FREE}'").count
    end

  end
end
