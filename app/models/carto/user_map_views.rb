module Carto
  class UserMapViews < ActiveRecord::Base

    belongs_to :user
    validates :user, :metric_date, presence: true
    # rubocop:disable Rails/ScopeArgs

    scope :last_billing_cycle, lambda do |start_date|
      where("metric_date >= DATE('#{start_date}')").order('metric_date DESC')
    end
    # rubocop:enable Rails/ScopeArgs

  end
end
