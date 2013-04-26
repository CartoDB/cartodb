# encoding: utf-8

module CartoDB
  module Visualization 
    class NameChecker
      def initialize(user, db=Sequel.sqlite)
        @user = user
        @db   = db
      end #initialize

      def available?(candidate)
        !db[:visualizations]
          .select(:name)
          .where(map_id: user.maps.map(&:id))
          .map { |record| record.fetch(:name) }
          .include?(candidate)
      end #available?

      private

      attr_reader :user, :db
    end # NameChecker
  end # Visualization
end # CartoDB

