module Carto
  class UserMapViews < ActiveRecord::Base

    belongs_to :user
    validates :user, :metric_date, presence: true
    # rubocop:disable Style/Lambda
    scope :last_billing_cycle, ->(start_date) {
      where("metric_date >= DATE('#{start_date}')").order('metric_date DESC')
    }
    # rubocop:enable Style/Lambda

  end
end
