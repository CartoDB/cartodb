# encoding: UTF-8

module Carto
  class UserDBService

      # Also default schema for new users
      SCHEMA_PUBLIC = 'public'
      SCHEMA_CARTODB = 'cartodb'
      SCHEMA_IMPORTER = 'cdb_importer'

    def initialize(user)
      @user = user
    end

    def rebuild_quota_trigger
      # TODO: Implement/clone from Sequel model
    end

    def build_search_path(user_schema = nil, quote_user_schema = true)
      user_schema ||= @user.database_schema
      UserDBService.build_search_path(user_schema, quote_user_schema)
    end

    # Centralized method to provide the (ordered) search_path
    def self.build_search_path(user_schema, quote_user_schema = true)
      quote_char = quote_user_schema ? "\"" : ""
      "#{quote_char}#{user_schema}#{quote_char}, #{SCHEMA_CARTODB}, #{SCHEMA_PUBLIC}"
    end


    def load_cartodb_functions
      #TODO: Implement
    end

  end
end
