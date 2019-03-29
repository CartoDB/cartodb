# encoding: utf-8

module Carto
  module Db
    class Role
      attr_reader :database_name, :name, :id

      def initialize(database_name:, name:)
        @database_name = database_name
        @name = name
        @id = extract_id(name)
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

      def carto_db_role?
        name.match(/#{Regexp.quote(Carto::Db::Role.db_username_prefix)}/)
      end

      def system_db_role?
        CartoDB::SYSTEM_DB_USERS.include?(name)
      end

      private

      def extract_id(name)
        id_data = name.split(Carto::Db::Role.db_username_prefix)
        # Return id exists else we return nil
        id_data.size > 1 ? id_data[1] : nil
      end

    end
  end
end
