require_relative './collection'

module CartoDB
  module Visualization
    class NameChecker
      def initialize(user)
        @user = user
      end

      def available?(candidate)
        !taken_names_for.include?(candidate)
      end

      private

      def taken_names_for
        @taken_names ||= Carto::Visualization::where(user_id: user.id).select(:name).map(&:name)
      end

      attr_reader :user
    end # NameChecker
  end # Visualization
end # CartoDB
