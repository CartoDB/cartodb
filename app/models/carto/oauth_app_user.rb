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

    before_save :manage_scopes

    def authorized?(requested_scopes)
      (requested_scopes - scopes).empty?
    end

    def upgrade!(requested_scopes)
      update!(scopes: (scopes + dataset_scopes) | requested_scopes)
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

    def dataset_scopes
      begin
        permissions = user.in_database.execute(%{
          SELECT
            r.rolname as grantee,
            s.nspname as schema,
            c.relname as table,
            acl.privilege_type as grant
          FROM
            pg_class c
            JOIN pg_namespace s ON c.relnamespace = s.oid
            JOIN LATERAL aclexplode(c.relacl) acl ON TRUE
            JOIN pg_roles r ON acl.grantee = r.oid
          WHERE
            r.rolname = "#{dataset_role_name}";
        })
      rescue ActiveRecord::StatementInvalid => e
        CartoDB::Logger.warning(message: 'Error running SQL command', exception: e)
      end

      # TODO continue....
    end

    def manage_scopes
      requested_dataset_scopes, no_dataset_scopes = split_dataset_scopes(scopes)
      dataset_scopes = manage_dataset_scopes(requested_dataset_scopes)
      self.scopes = (dataset_scopes + no_dataset_scopes)
    end

    def split_dataset_scopes(scopes)
      dataset_scopes = []
      no_dataset_scopes = []

      scopes.each do |scope|
        if DatasetsScope.is_a?(scope)
          dataset_scopes << scope
        else
          no_dataset_scopes << scope
        end
      end

      return dataset_scopes, no_dataset_scopes
    end

    def manage_dataset_scopes(requested_dataset_scopes)
      # TODO if role exists?
      create_dataset_role
      grant_privileges_for_dataset_role(requested_dataset_scopes)
    end

    def create_dataset_role
      begin
        user.in_database(as: :superuser).execute("CREATE ROLE \"#{dataset_role_name}\" CREATEROLE")
      rescue ActiveRecord::StatementInvalid => e
        CartoDB::Logger.warning(message: 'Error running SQL command', exception: e)
        raise Carto::UnprocesableEntityError.new(/PG::Error: ERROR:  (.+)/ =~ e.message && $1 || 'Unexpected error')
      end
    end

    def grant_privileges_for_dataset_role(requested_dataset_scopes)
      dataset_scopes = []

      requested_dataset_scopes.each do |scope|
        begin
          user.in_database.execute(%{
            GRANT #{scope.permission.join(',')}
            ON #{DatasetsScope.table(scope)}
            TO \"#{dataset_role_name}\" WITH GRANT OPTION"
          })

          dataset_scopes << scope
        rescue ActiveRecord::StatementInvalid => e
          CartoDB::Logger.warning(message: 'Error running SQL command', exception: e)
        end

        dataset_scopes
      end
    end

    def dataset_role_name
      "carto_oauth_app_#{id}"
    end

  end
end
