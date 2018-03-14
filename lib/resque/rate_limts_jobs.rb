# encoding: utf-8

require 'resque-metrics'
require_relative '../cartodb/metrics'

module Resque
  module RateLimitsJobs
    class UpdateRedis
      extend ::Resque::Metrics
      @queue = :users

      def self.perform(account_type)
        rate_limit = Carto::AccountType.find(account_type).rate_limit
        User.where(account_type: account_type, rate_limit_id: nil).find_each do |user|
          rate_limit.save_to_redis(user)
        end
      end
    end
  end
end
