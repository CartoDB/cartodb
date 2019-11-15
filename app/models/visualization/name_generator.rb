require_relative './name_checker'

module CartoDB
  module Visualization
    class NameGenerator
      PATTERN = 'Untitled map'

      def initialize(user, checker=nil)
        @user     = user
        @checker  = checker || NameChecker.new(user)
      end

      def name(candidate=PATTERN, iteration=0)
        candidate = (candidate || PATTERN).strip
        new_candidate = iteration > 0 ? "#{candidate} #{iteration}" : candidate
        return new_candidate if checker.available?(new_candidate)

        name(candidate, iteration + 1)
      end

      private

      attr_reader :checker, :user
    end
  end
end
