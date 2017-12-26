# encoding: UTF-8

module Carto
  class UserDBService
    # Also default schema for new users
    SCHEMA_PUBLIC = 'public'.freeze
    SCHEMA_CARTODB = 'cartodb'.freeze
    SCHEMA_IMPORTER = 'cdb_importer'.freeze
    SCHEMA_CDB_DATASERVICES_API = 'cdb_dataservices_client'.freeze

    def initialize(user)
      @user = user
    end

    def build_search_path(user_schema = nil, quote_user_schema = true)
      user_schema ||= @user.database_schema
      UserDBService.build_search_path(user_schema, quote_user_schema)
    end

    # Centralized method to provide the (ordered) search_path
    def self.build_search_path(user_schema, quote_user_schema = true)
      # TODO Add SCHEMA_CDB_GEOCODER when we open the geocoder API to all the people
      quote_char = quote_user_schema ? "\"" : ""
      "#{quote_char}#{user_schema}#{quote_char}, #{SCHEMA_CARTODB}, #{SCHEMA_CDB_DATASERVICES_API}, #{SCHEMA_PUBLIC}"
    end

    def public_user_roles
      @user.organization_user? ? [CartoDB::PUBLIC_DB_USER, @user.service.database_public_username] : [CartoDB::PUBLIC_DB_USER]
    end

    # Execute a query in the user database
    # @param [String] query, using $1, $2 ... for placeholders
    # @param ... values for the placeholders
    # @return [Array<Hash<String, Value>>] Something ({ActiveRecord::Result} in this case) that behaves like an Array
    #                                      of Hashes that map column name (as string) to value
    # @raise [PG::Error] if the query fails
    def execute_in_user_database(query, *binds)
      @user.in_database.exec_query(query, 'ExecuteUserDb', binds.map { |v| [nil, v] })
    rescue ActiveRecord::StatementInvalid => exception
      raise exception.cause
    end
  end
end
