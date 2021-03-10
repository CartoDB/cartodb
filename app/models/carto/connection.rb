module Carto
  class Connection < ActiveRecord::Base

    TYPE_OAUTH_SERVICE = 'oauth-service'.freeze
    TYPE_DB_CONNECTOR = 'db-connector'.freeze

    SHARED_NAME_SEPARATOR = '.'

    belongs_to :user, class_name: 'Carto::User', inverse_of: :individual_connections
    belongs_to :organization, class_name: 'Carto::Organization', inverse_of: :connections

    scope :oauth_connections, -> { where(connection_type: TYPE_OAUTH_SERVICE) }
    scope :db_connections, -> { where(connection_type: TYPE_DB_CONNECTOR) }
    scope :shared_connections, -> { where(user_id: nil) }
    scope :individual_connections, -> { where(organization_id: nil) }

    validates :name, presence: true, uniqueness: { scope: [ :user_id, :organization_id ]}

    validates :connection_type, inclusion: { in: [TYPE_OAUTH_SERVICE, TYPE_DB_CONNECTOR] }
    validates :connector, uniqueness: { scope: [:user_id, :connection_type] }, if: :singleton_connection?
    validate :validate_name
    validate :validate_ownership
    validate :validate_parameters

    def shared?
      user.blank? && organization.present?
    end

    def individual?
      !shared?
    end

    def editable_by?(some_user)
      shared? ? some_user == organization.owner : some_user == user
    end

    def usable_by?(some_user)
      shared? ? some_user.organization == organization : some_user == user
    end

    # rubocop:disable Naming/AccessorMethodName
    def get_service_datasource
      check_type! TYPE_OAUTH_SERVICE, "Invalid connection type (#{connection_type}) to get service datasource"

      datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(
        connector,
        user,
        http_timeout: ::DataImport.http_timeout_for(user)
      )
      datasource.token = token unless datasource.nil?
      datasource
    end
    # rubocop:enable Naming/AccessorMethodName

    def service
      check_type! TYPE_OAUTH_SERVICE, "service not available for connection of type #{connection_type}"

      connector
    end

    def provider
      check_type! TYPE_DB_CONNECTOR, "provider not available for connection of type #{connection_type}"

      connector
    end

    before_validation :manage_prevalidation
    after_create :manage_create
    after_update :manage_update
    after_destroy :manage_destroy

    private

    def owner
      user || organization.owner
    end

    def check_type!(type, message)
      raise message unless connection_type == type
    end

    def connection_manager
      Carto::ConnectionManager.new(owner)
    end

    def manage_create
      connection_manager.manage_create(self)
    end

    def manage_update
      connection_manager.manage_update(self)
    end

    def manage_destroy
      connection_manager.manage_destroy(self)
    end

    def manage_prevalidation
      connection_manager.manage_prevalidation(self)
    end

    def singleton_connection?
      Carto::ConnectionManager.singleton_connector?(self)
    end

    def validate_ownership
      if user_id.present? && organization_id.present?
        errors.add :base, "Connection can't belong to an user and an organization simultaneously"
      elsif user_id.blank? && organization_id.blank?
        errors.add :user_id, "Connection must belong to user or be shared (belong to organization)"
      end
      if shared? && connection_type == TYPE_OAUTH_SERVICE
        errors.add :connection_type, "OAuth connections cannot be shared"
      end
    end

    def validate_parameters
      Carto::ConnectionManager.errors(self).each do |error|
        errors.add :connector, error
      end
      case connection_type
      when TYPE_OAUTH_SERVICE
        if token.blank?
          errors.add :token, 'Missing OAuth'
        elsif parameters.present?
          # OAuth connections that also admit db-connector parameters (BigQuery)
          # can be saved incomplete without the parameters; once the parameters are assigned,
          # the db connection is validates
          validate_db_connection
        end
      when TYPE_DB_CONNECTOR
        validate_db_connection
      end
    end

    def validate_db_connection
      connection_manager.check(self)
    rescue Carto::Connector::InvalidParametersError => e
      if e.to_s.match?(/Invalid provider/im)
        errors.add :connector, e.to_s
      else
        errors.add :parameters, e.to_s
      end
    rescue CartoDB::Datasources::AuthError, CartoDB::Datasources::TokenExpiredOrInvalidError => e
      errors.add :token, e.to_s
    rescue StandardError => e
      errors.add :base, e.to_s
    end

    def validate_name
      if shared?
        prefix, *rest = name.split(SHARED_NAME_SEPARATOR)
        if rest.size > 1
          errors.add :name, "The name must contain only one dot to separate the organization name from the rest"
        elsif rest.size == 0
          errors.add :name, "The connection name must be separeted from the organization name by a dot"
        end
        if prefix != organization.name
          errors.add :name, "For a shared connection the name must be preceded by the organization name and a dot"
        end
        connection_name = rest.first
      else
        connection_name = name
      end
      if connection_name.blank?
        errors.add :name, "The connection name cannot be blank"
      elsif !connection_name.match?(/\A[a-z\d_-]+\Z/)
        errors.add :name, "The connection name includes invalid characters; only letters a-z, digits 0-9, underscore (_) and hyphen (-) are allowed"
      end
    end
  end
end
