# encoding: utf-8
require_relative './name_checker'

module CartoDB
  module Visualization
    class NameGenerator
      PATTERN = 'Untitled visualization'

      def initialize(user, checker=nil)
        @user     = user
        @checker  = checker || NameChecker.new(user)
      end #initialize

      def name(candidate=PATTERN, iteration=0)
        candidate = (candidate || PATTERN).strip
        return candidate if checker.available?(candidate)

        new_candidate = "#{candidate} #{iteration}"
        name(new_candidate, iteration + 1)
      end #name

      private

      attr_reader :checker, :user
    end # NameGenerator
  end # Visualization
end # CartoDB

