# encoding: utf-8

module CartoDB
  module Visualization
    class NameGenerator
      PATTERN = 'Untitled visualization'

      def initialize(user, checker=NameChecker.new)
        @user     = user
        @checker  = checker
      end #initialize

      def name(candidate=PATTERN, iteration=0)
        return candidate if checker.available?(user, candidate)

        new_candidate = "#{candidate} #{iteration}"
        name(new_candidate, iteration + 1)
      end #name

      private

      attr_reader :checker, :user, :candidate
    end # NameGenerator

    def NameChecker
      def available?(candidate)
        db[:visualizations]
          .select(:name)
          .where(map_id: user.maps.map(&:id))
          .include?(candidate)
      end #available?
    end #NameChecker
  end # Visualization
end # CartoDB

