# encoding: utf-8

module CartoDB
  module Visualization
    class NameGenerator
      PATTERN = 'Untitled visualization'

      def initialize(user, checker=nil)
        @user     = user
        @checker  = checker || NameChecker.new(user, Rails::Sequel.connection)
      end #initialize

      def name(candidate=PATTERN, iteration=0)
        return candidate if checker.available?(candidate)

        new_candidate = "#{candidate} #{iteration}"
        name(new_candidate, iteration + 1)
      end #name

      private

      attr_reader :checker, :user
    end # NameGenerator
  end # Visualization
end # CartoDB

