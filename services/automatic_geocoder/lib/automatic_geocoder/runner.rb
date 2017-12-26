# encoding: utf-8
require 'eventmachine'
require File.expand_path('../../../../../config/environment.rb',  __FILE__)

module CartoDB
  module AutomaticGeocoder
    class Runner
      TICK_TIME_IN_SECS = 10
      RUN_FOREVER       = 0

      attr_reader :ticks

      def initialize(options = {})
        @max_ticks          = options.fetch(:max_ticks, RUN_FOREVER)
        @ticks              = 0
      end

      def run
        EventMachine.run do
          EventMachine::PeriodicTimer.new(21600) do
            puts 'fetching job_collection'
            AutomaticGeocoding.active.map &:enqueue
          end
        end
      end

    end # Runner
  end # AutomaticGeocoder
end # CartoDB
