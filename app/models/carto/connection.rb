module Carto
  class Connection < ActiveRecord::Base

    include ::MessageBrokerHelper

    TYPE_OAUTH_SERVICE = 'oauth-service'.freeze
    TYPE_DB_CONNECTOR = 'db-connector'.freeze

    belongs_to :user, class_name: 'Carto::User', inverse_of: :connections

    scope :oauth_connections, -> { where(connection_type: TYPE_OAUTH_SERVICE) }
    scope :db_connections, -> { where(connection_type: TYPE_DB_CONNECTOR) }

    validates :name, uniqueness: { scope: :user_id }, presence: true
    validates :connection_type, inclusion: { in: [TYPE_OAUTH_SERVICE, TYPE_DB_CONNECTOR] }
    validates :connector, uniqueness: { scope: [:user_id, :connection_type] }, if: :singleton_connection?
    validate :validate_parameters

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
    after_create :notify_central_bq_connection_created, if: :bigquery_connector?
    after_update :manage_update
    after_destroy :manage_destroy
    after_destroy :notify_central_bq_connection_deleted, if: :bigquery_connector?

    def complete?
      connection_manager.complete?(self)
    end

    def notify_central_bq_connection_created
      cartodb_central_topic.publish(
        :grant_do_full_access,
        { username: user.username, target_email: bq_permissions_target_mail }
      )
    end

    def notify_central_bq_connection_deleted
      cartodb_central_topic.publish(
        :revoke_do_full_access,
        { username: user.username, target_email: bq_permissions_target_mail }
      )
    end

    private

    def bigquery_connector?
      connector == 'bigquery'
    end

    def bq_permissions_target_mail
      if connection_type == TYPE_OAUTH_SERVICE
        user.email
      elsif connection_type == TYPE_DB_CONNECTOR
        JSON.parse(parameters['service_account'])['client_email']
      else
        raise 'Unsuported connection_type'
      end
    end

    def check_type!(type, message)
      raise message unless connection_type == type
    end

    def connection_manager
      Carto::ConnectionManager.new(user)
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

  end
end
