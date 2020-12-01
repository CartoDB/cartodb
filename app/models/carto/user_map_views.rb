
module Carto
  class UserMapViews < ActiveRecord::Base
    belongs_to :user
    validates :user, :metric_date, presence: true
    scope :current_month, -> { where("metric_date >= date_trunc('month', CURRENT_DATE)").order('metric_date DESC') }
  end
end
