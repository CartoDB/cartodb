# encoding: utf-8
require_relative './collection'

module CartoDB
  module Visualization 
    class NameChecker
      def initialize(user)
        @user = user
      end #initialize

      def available?(candidate)
        !taken_names_for(user).include?(candidate)
      end #available?

      private

      def taken_names_for(user)
        Visualization::Collection.new
                                 .fetch(user_id: user.id)
                                 .map(&:name)
      end #taken_names

      attr_reader :user
    end # NameChecker
  end # Visualization
end # CartoDB

