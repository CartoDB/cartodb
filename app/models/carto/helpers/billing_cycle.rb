module Carto
  module BillingCycle
    def last_billing_cycle
      day = period_end_date.day rescue 29.days.ago.day
      # << operator substract 1 month from the date object
      date = (day > Date.today.day ? Date.today << 1 : Date.today)
      begin
        Date.parse("#{date.year}-#{date.month}-#{day}")
      rescue ArgumentError
        day = day - 1
        retry
      end
    end
  end
end
