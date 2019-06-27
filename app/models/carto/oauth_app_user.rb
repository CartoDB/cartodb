# encoding: utf-8

require_dependency 'carto/oauth_provider/scopes'
require_dependency 'carto/oauth_provider/errors'

module Carto
  class OauthAppUser < ActiveRecord::Base
    include OauthProvider::Scopes
    belongs_to :user, inverse_of: :oauth_app_users
    belongs_to :oauth_app, inverse_of: :oauth_app_users
    belongs_to :api_key, inverse_of: :oauth_app_user
    has_many :oauth_authorization_codes, inverse_of: :oauth_app_user, dependent: :destroy
    has_many :oauth_access_tokens, inverse_of: :oauth_app_user, dependent: :destroy
    has_many :oauth_refresh_tokens, inverse_of: :oauth_app_user, dependent: :destroy

    validates :user, presence: true, uniqueness: { scope: :oauth_app }
    validates :oauth_app, presence: true
    validates :scopes, scopes: true
    validate  :validate_user_authorizable, on: :create

    after_create :create_roles, :ensure_role_grants, unless: :skip_role_setup
    before_update :grant_dataset_role_privileges
    after_destroy :drop_dataset_role, unless: :skip_role_setup

    attr_accessor :skip_role_setup

    def authorized?(requested_scopes)
      OauthProvider::Scopes.subtract_scopes(requested_scopes, all_scopes, user.database_schema).empty?
    end

    def upgrade!(requested_scopes)
      update!(scopes: all_scopes | requested_scopes)
    end

    def all_scopes
      no_dataset_scopes + dataset_scopes
    end

    def revoke_permissions(table, revoked_permissions)
      db_connection = user.in_database(as: :superuser)
      Carto::TableAndFriends.apply(db_connection, table.database_schema, table.name) do |_s, _t, qualified_name|
        query = %{
          REVOKE #{revoked_permissions.join(', ')}
          ON TABLE #{qualified_name}
          FROM \"#{dataset_role_name}\"
        }
        db_connection.execute(query)
        sequences_for_table(qualified_name).each do |seq|
          db_connection.execute("REVOKE ALL ON SEQUENCE #{seq} FROM \"#{dataset_role_name}\"")
        end
      end
    end

    def create_roles
      db_run(create_dataset_role_query)
      db_run(create_ownership_role_query)
    end

    def create_dataset_role_query
      "CREATE ROLE \"#{dataset_role_name}\" CREATEROLE"
    end

    def create_ownership_role_query
      "CREATE ROLE \"#{ownership_role_name}\""
    end

    def ensure_role_grants
      grant_dataset_role_privileges
      grant_ownership_role_privileges
    end

    def grant_ownership_role_privileges
      db_run("GRANT \"#{ownership_role_name}\" TO \"#{user.database_username}\"")
    end

    def grant_dataset_role_privileges
      validate_scopes

      invalid_scopes = []
      DatasetsScope.valid_scopes(scopes).each do |scope|
        dataset_scope = DatasetsScope.new(scope)

        schema = dataset_scope.schema || user.database_schema
        schema_table = Carto::TableAndFriends.qualified_table_name(schema, dataset_scope.table)

        table_query = %{
          GRANT #{dataset_scope.permission.join(',')}
          ON TABLE #{schema_table}
          TO \"#{dataset_role_name}\" WITH GRANT OPTION;
        }

        schema_query = %{
          GRANT USAGE ON SCHEMA \"#{schema}\"
          TO \"#{dataset_role_name}\";
        }

        begin
          user.in_database(as: :superuser).execute(table_query)
          user.in_database(as: :superuser).execute(schema_query)
          sequences_for_table(schema_table).each do |seq|
            seq_query = "GRANT USAGE, SELECT ON SEQUENCE #{seq} TO \"#{dataset_role_name}\""
            user.in_database(as: :superuser).execute(seq_query)
          end
        rescue ActiveRecord::StatementInvalid => e
          invalid_scopes << scope
          CartoDB::Logger.error(message: 'Error granting permissions to dataset role', exception: e)
        end
      end

      raise OauthProvider::Errors::InvalidScope.new(invalid_scopes) if invalid_scopes.any?
    end

    def ownership_role_name
      "carto_oauth_app_o_#{id}"
    end

    private

    def validate_user_authorizable
      return unless oauth_app.try(:restricted?)

      organization = user.organization
      return errors.add(:user, 'is not part of an organization') unless user.organization

      org_authorization = oauth_app.oauth_app_organizations.where(organization: organization).first
      unless org_authorization
        return errors.add(:user, 'is part of an organization which is not allowed access to this application')
      end

      errors.add(:user, 'does not have an available seat to use this application') unless org_authorization.open_seats?
    end

    def no_dataset_scopes
      DatasetsScope.non_dataset_scopes(scopes)
    end

    def dataset_scopes
      begin
        results = user.db_service.all_tables_granted(dataset_role_name)
      rescue ActiveRecord::StatementInvalid => e
        CartoDB::Logger.error(message: 'Error getting scopes', exception: e)
        raise OauthProvider::Errors::ServerError.new
      end

      scopes = []
      results.each do |row|
        permission = DatasetsScope.permission_from_db_to_scope(row['permission'])
        unless permission.nil?
          schema = row['schema'] != user.database_schema ? "#{row['schema']}." : ''
          scopes << "datasets:#{permission}:#{schema}#{row['t']}"
        end
      end
      scopes
    end

    def drop_dataset_role
      queries = %{
        DROP OWNED BY \"#{dataset_role_name}\";
        DROP ROLE \"#{dataset_role_name}\";
      }
      user.in_database(as: :superuser).execute(queries)
    rescue ActiveRecord::StatementInvalid => e
      CartoDB::Logger.error(message: 'Error dropping dataset role', exception: e)
      raise OauthProvider::Errors::ServerError.new
    end

    def validate_scopes
      invalid_scopes = OauthProvider::Scopes.invalid_scopes_and_tables(scopes, user)
      raise OauthProvider::Errors::InvalidScope.new(invalid_scopes) if invalid_scopes.present?
    end

    def sequences_for_table(schema_table)
      query = %{
        SELECT
          n.nspname, quote_ident(c.relname) as relname
        FROM
          pg_depend d
          JOIN pg_class c ON d.objid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE
          d.refobjsubid > 0 AND
          d.classid = 'pg_class'::regclass AND
          c.relkind = 'S'::"char" AND
          d.refobjid = ('#{schema_table}')::regclass
      }

      user.in_database.execute(query).map { |r| "\"#{r['nspname']}\".#{r['relname']}" }
    end

    def dataset_role_name
      "carto_oauth_app_#{id}"
    end

    def db_run(query, connection = db_connection)
      connection.execute(query)
    rescue ActiveRecord::StatementInvalid => e
      CartoDB::Logger.error(message: 'Error running SQL command', exception: e)
      raise OauthProvider::Errors::ServerError.new
    end

    def db_connection
      @db_connection ||= user.in_database(as: :superuser)
    end
  end
end
