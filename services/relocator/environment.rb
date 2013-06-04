# encoding: utf-8

module CartoDB
  module Relocator
    class Environment
      def initialize(environment='development', user_id)
        @environment  = environment
        @user_id      = user_id
      end #initialize

      def database_username
        "#{db_username_prefix}#{user_id}"
      end #database_username

      def user_database
        "#{database_name_prefix}#{user_id}_db"
      end #user_database

      def db_username_prefix
        return "cartodb_user_" if environment == 'production'
        return "development_cartodb_user_" if environment == 'development'
        "cartodb_user_#{environment}_"
      end #username_prefix

      def database_name_prefix
        return "cartodb_user_" if environment == 'production'
        return "cartodb_dev_user_" if environment == 'development'
        "cartodb_#{environment}_user_"
      end #database_prefix
      
      private

      attr_accessor :environment, :user_id
    end # Environment
  end # Relocator
end # CartoDB
