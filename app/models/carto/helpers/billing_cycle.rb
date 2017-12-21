require 'active_support/time'

module Carto
  module BillingCycle
    def last_billing_cycle
      day = period_end_date ? period_end_date.day : 29.days.ago.day
      date = (day > Date.today.day ? (Date.today - 1.month) : Date.today)
      begin
        Date.new(date.year, date.month, day)
      rescue ArgumentError
        day = day - 1
        retry
      end
    end
  end
end
