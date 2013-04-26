# encoding: utf-8

module CartoDB
  module Visualization 
    class NameChecker
      def initialize(user, db=Sequel.sqlite)
        @user = user
        @db   = db
      end #initialize

      def available?(candidate)
        matches = db[:visualizations]
                    .select(:name)
                    .where(map_id: user.maps.map(&:id))

        return true if matches.nil? || matches.empty?
        names = matches.map { |record| record.fetch(:name) }
        !names.include?(candidate)
      end #available?

      private

      attr_reader :user, :db
    end # NameChecker
  end # Visualization
end # CartoDB

