# encoding: utf-8

module Carto
  module Db
    class User
      attr_reader :database_name, :name, :id

      def initialize(database_name:, name:)
        @database_name = database_name
        @name = name
        @id = extract_id
      end

      def ==(other)
        @database_name == other.database_name && @name == other.name
      end

      def self.db_username_prefix
        return "cartodb_user_" if Rails.env.production?
        return "development_cartodb_user_" if Rails.env.development?
        return "test_cartodb_user_" if Rails.env.test?
        return "cartodb_staging_user_" if Rails.env.staging?
      end

      def carto_user
        name.match(/#{Regexp.quote(Carto::Db::User.db_username_prefix)}/)
      end

      private

      def extract_id
        id_data = name.split(Carto::Db::User.db_username_prefix)
        # Return id exists else we return nil
        id_data.size > 1 ? id_data[1] : nil
      end

    end
  end
end
