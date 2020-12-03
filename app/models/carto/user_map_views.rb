module Carto
  class UserMapViews < ActiveRecord::Base

    belongs_to :user
    validates :user, :metric_date, presence: true
    scope :last_billing_cycle, lambda do |start_date|
      where("metric_date >= DATE('#{start_date}')").order('metric_date DESC')
    end

  end
end
