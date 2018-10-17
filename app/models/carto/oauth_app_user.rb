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

    after_create :create_dataset_role, :manage_scopes
    before_update :manage_scopes

    def authorized?(requested_scopes)
      (requested_scopes - (no_dataset_scopes + dataset_scopes)).empty?
    end

    def upgrade!(requested_scopes)
      update!(scopes: (no_dataset_scopes + dataset_scopes) | requested_scopes)
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
      DatasetsScope.invalid_scopes(scopes)
    end

    def dataset_scopes
      dataset_scopes = []
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
          r.rolname = '#{dataset_role_name}'
        GROUP BY schema, t;
      }

      begin
        results = user.in_database(as: :superuser).execute(query)
      rescue ActiveRecord::StatementInvalid => e
        CartoDB::Logger.warning(message: 'Error running SQL command', exception: e)
      end

      results.each do |row|
        permission = DatasetsScope.permission_from_db_to_scope(row['permission'])
        dataset_scopes << "datasets:#{permission}:#{row['t']}"
      end

      dataset_scopes
    end

    def create_dataset_role
      begin
        user.in_database(as: :superuser).execute("CREATE ROLE \"#{dataset_role_name}\" CREATEROLE")
      rescue ActiveRecord::StatementInvalid => e
        raise OauthProvider::Errors::AccessDenied.new unless e.message =~ /already exist/
      end
    end

    def manage_scopes
      grant_privileges_for_dataset_role(DatasetsScope.valid_scopes(scopes))
    end

    def grant_privileges_for_dataset_role(requested_dataset_scopes)
      requested_dataset_scopes.each do |scope|
        dataset_scope = DatasetsScope.new(scope)
        query = %{
          GRANT #{dataset_scope.permission.join(',')}
          ON #{dataset_scope.table}
          TO \"#{dataset_role_name}\" WITH GRANT OPTION
        }

        begin
          user.in_database.execute(query)
        rescue ActiveRecord::StatementInvalid => e
          raise OauthProvider::Errors::AccessDenied.new unless e.message =~ /already exist/
        end
      end
    end

    def dataset_role_name
      "carto_oauth_app_#{id}"
    end

  end
end
