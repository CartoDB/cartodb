# encoding: utf-8

module CartoDB
  module Relocator
    class Environment
      def initialize(environment='development', user_id)
        @environment  = environment
        @user_id      = user_id
      end #initialize

      def database_username
        "#{environment}_cartodb_user_#{user_id}"
      end #database_username

      def user_database
        return "cartodb_dev_user_#{user_id}_db" if environment == 'development'
        "cartodb_#{environment}_user_#{user_id}_db"
      end #user_database

      private

      attr_accessor :environment, :user_id
    end # Environment
  end # Relocator
end # CartoDB

