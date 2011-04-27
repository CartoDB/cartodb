module Resque
  module QueriesThresholdJobs
    @queue = :queries_threshold

    def self.perform(user_id, sql, time)
      CartoDB::QueriesThreshold.analyze(user_id, sql, time)
    end
  end
end