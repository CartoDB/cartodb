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

    def tables_effective(schema = 'public')
      query = "select table_name::text from information_schema.tables where table_schema = '#{schema}'"
      execute_in_user_database(query).map { |i| i['table_name'] }
    end

    def all_user_roles
      roles = []
      roles << "'#{@user.database_username}'"
      if @user.organization_user?
        roles << "'#{organization_member_group_role_member_name}'"
        if !@user.groups.nil?
          @user.groups.each do |group|
            roles << "'#{group.database_role}'"
          end
        end
      end
      roles
    end

    def all_tables_granted(role = nil)
      roles = []
      if !role.nil?
        roles << "'#{role}'"
      else
        roles = all_user_roles
      end

      query = %{
        SELECT
          s.nspname as schema,
          c.relname as t,
          string_agg(lower(acl.privilege_type), ',') as permission
        FROM
          pg_class c
          JOIN pg_namespace s ON c.relnamespace = s.oid
          JOIN LATERAL aclexplode(c.relacl) acl ON TRUE
          JOIN pg_roles r ON acl.grantee = r.oid
        WHERE
          r.rolname in(#{roles.join(',')})
        GROUP BY schema, t;
      }

      @user.in_database(as: :superuser) do |database|
        database.execute(query)
      end
    end

    def all_tables_granted_hashed(role = nil)
      results = all_tables_granted(role)
      privileges_hashed = {}

      if !results.nil?
        results.each do |row|
          privileges_hashed[row['schema']] = {} if privileges_hashed[row['schema']].nil?
          privileges_hashed[row['schema']][row['t']] = row['permission'].split(',')
        end
      end

      privileges_hashed
    end

    def organization_member_group_role_member_name
      query = "SELECT cartodb.CDB_Organization_Member_Group_Role_Member_Name() as org_member_role;"
      execute_in_user_database(query).first['org_member_role']
    end
  end
end
