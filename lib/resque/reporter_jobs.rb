require_relative './base_job'

module Resque
  module Reporter
    module Mail
      module TrendingMapsReport
        @queue = :users

        def self.perform(mail_to, trending_visualizations)
          ReporterMailer.trending_maps_report(mail_to, trending_visualizations).deliver_now
        end
      end
    end
  end
end
