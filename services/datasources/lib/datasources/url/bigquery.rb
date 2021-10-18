# encoding: utf-8

require 'signet/oauth_2/client'
require_relative '../../../../../lib/carto/http/client'
require 'google/apis/bigquery_v2'
require 'google/apis/oauth2_v2'

module CartoDB
  module Datasources
    module Url
      class BigQuery < BaseOAuth

        # Required for all providers
        DATASOURCE_NAME = 'bigquery'

        MAX_PROJECTS = 500_000
        MAX_DATASETS = 500_000
        MAX_TABLES = 500_000

        EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email'.freeze

        # Constructor (hidden)
        # @param config
        # [
        #  'application_name'
        #  'client_id'
        #  'client_secret'
        # ]
        # @param user ::User
        # @throws UninitializedError
        # @throws MissingConfigurationError
        def initialize(config, user)
          super(config, user, %w{ application_name client_id client_secret callback_url }, DATASOURCE_NAME)

          raise UninitializedError.new('missing user instance', DATASOURCE_NAME) if user.nil?

          @user = user

          self.filter = []
          @refresh_token = nil

          @client = Signet::OAuth2::Client.new(
            authorization_uri: config.fetch('authorization_uri'),
            token_credential_uri:  config.fetch('token_credential_uri'),
            client_id: config.fetch('client_id'),
            client_secret: config.fetch('client_secret'),
            scope: config.fetch('scope') + [EMAIL_SCOPE],
            redirect_uri: config.fetch('callback_url'),
            access_type: :offline,
            additional_parameters: { login_hint: @user.email }
          )
          @revoke_uri = config.fetch('revoke_auth_uri')
          @bigquery_api = Google::Apis::BigqueryV2::BigqueryService.new
          @bigquery_api.authorization = @client
        end

        # Factory method
        # @param config {}
        # @param user ::User
        # @return CartoDB::Datasources::Url::GDrive
        def self.get_new(config, user)
          new(config, user)
        end

        # If will provide a url to download the resource, or requires calling get_resource()
        # @return bool
        def providers_download_url?
          false
        end

        # Return the url to be displayed or sent the user to to authenticate and get authorization code
        # @return string | nil
        def get_auth_url()
          service_name = service_name_for_user(DATASOURCE_NAME, @user)
          @client.state = CALLBACK_STATE_DATA_PLACEHOLDER.sub('service', service_name)
                                                         .sub('user', @user.username)
          @client.authorization_uri.to_s
        end

        # Validates the authorization callback
        # @param params : mixed
        def validate_callback(params)
          if params[:error].present?
            raise AuthError.new("validate_callback: #{params[:error]}", DATASOURCE_NAME)
          end

          if params[:code]
            validate_auth_code(params[:code])
          else
            raise AuthError.new('validate_callback: Missing authorization code', DATASOURCE_NAME)
          end
        end

        # Validate authorization code and store token
        # @param auth_code : string
        # @return string : Access token
        # @throws AuthError
        def validate_auth_code(auth_code)
          @client.code = auth_code
          @client.fetch_access_token!
          if @client.refresh_token.nil?
            raise AuthError.new(
              "Error validating auth token. Is this Google account linked to another CARTO account?",
              DATASOURCE_NAME
            )
          end
          @refresh_token = @client.refresh_token
          check_user_email @client.access_token
          @refresh_token
        rescue Google::Apis::AuthorizationError, Signet::AuthorizationError => ex
          raise AuthError.new("validating auth code: #{ex.message}", DATASOURCE_NAME)
        end

        def check_user_email(access_token)
          auth = Signet::OAuth2::Client.new(access_token: access_token)
          service = Google::Apis::Oauth2V2::Oauth2Service.new
          service.authorization = auth
          response = service.tokeninfo
          unless response.email.to_s.casecmp(@user.email).zero?
            revoke_token
            raise AuthError.new(
              'The email used for authorization must match the email in the CARTO account. ' \
              'The authorization has been revoked',
              DATASOURCE_NAME
            )
          end
        end

        # Store the refresh token
        # Triggers generation of a valid access token for the lifetime of this instance
        # @param token string
        # @throws AuthError
        def token=(token)
          @refresh_token = token
          @client.update_token!(refresh_token: @refresh_token)
          @client.fetch_access_token!
        rescue Google::Apis::AuthorizationError, Signet::AuthorizationError => ex
          raise TokenExpiredOrInvalidError.new("Invalid token: #{ex.message}", DATASOURCE_NAME)
        rescue Google::Apis::ClientError, \
               Google::Apis::ServerError, Google::Apis::BatchError, Google::Apis::TransmissionError => ex
          raise AuthError.new("setting token: #{ex.message}", DATASOURCE_NAME)
        end

        # Retrieve token
        # @return string | nil
        def token
          @refresh_token
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ Hash ]
        def get_resources_list(filter=[])
          filter
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        def get_resource(id)
          raise 'Not supported by this datasource'
        end

        # @param id string
        # @return Hash
        # @throws TokenExpiredOrInvalidError
        # @throws DataDownloadError
        # @throws NotFoundDownloadError
        def get_resource_metadata(id)
          {
            id: id
          }
        end

        # Retrieves current filters. Unused as here there's no get_resources_list
        # @return {}
        def filter
          {}
        end

        # Sets current filters. Unused as here there's no get_resources_list
        # @param filter_data {}
        def filter=(filter_data=[])
          filter_data
        end

        # Just return datasource name
        # @return string
        def to_s
          DATASOURCE_NAME
        end

        # If this datasource accepts a data import instance
        # @return Boolean
        def persists_state_via_data_import?
          false
        end

        # Stores the data import item instance to use/manipulate it
        # @param value DataImport
        def data_import_item=(value)
          nil
        end

        # Checks if token is still valid or has been revoked
        # @return bool
        # @throws AuthError
        def token_valid?
          @client.fetch_access_token!
          true
        rescue Google::Apis::AuthorizationError, Signet::AuthorizationError
          false
        rescue Google::Apis::BatchError, Google::Apis::TransmissionError, Google::Apis::ClientError, \
               Google::Apis::ServerError => ex
          raise AuthError.new("token_valid?(): #{ex.message}", DATASOURCE_NAME)
        end

        # Revokes current set token
        def revoke_token
          http_client = Carto::Http::Client.get(DATASOURCE_NAME,
            connecttimeout: 60,
            timeout: 600
          )
          response = http_client.get("#{@revoke_uri}?token=#{token}")
          if response.code == 200
            true
          end
        rescue StandardError => ex
          raise AuthError.new("revoke_token: #{ex.message}", DATASOURCE_NAME)
        end

        def create_dataset(project_id, dataset_id, options)
          dataset = Google::Apis::BigqueryV2::Dataset.new(options.merge({
            :dataset_reference => Google::Apis::BigqueryV2::DatasetReference.new({
              :project_id => project_id,
              :dataset_id => dataset_id,
            })
          }))
          @bigquery_api.insert_dataset(project_id, dataset)
        end

        def list_projects
          projects = @bigquery_api.list_projects(max_results: MAX_PROJECTS).projects
          return [] unless projects
          projects.map { |p| { id: p.id, friendly_name: p.friendly_name } }
        end

        def list_datasets(project_id)
          datasets = @bigquery_api.list_datasets(project_id, max_results: MAX_DATASETS).datasets
          if datasets
            datasets.map { |d|
              qualified_name = d.id.gsub(':', '.') # "#{project_id}.#{d.dataset_reference.dataset_id}"
              { id: d.dataset_reference.dataset_id, qualified_name: qualified_name, location: d.location }
            }
          else
            []
          end
        end

        def list_tables(project_id, dataset_id)
          tables = @bigquery_api.list_tables(project_id, dataset_id, max_results: MAX_TABLES).tables
          if tables
            tables.map { |t|
              qualified_name = t.id.gsub(':', '.') # "#{project_id}.#{dataset_id}.#{t.table_reference.table_id}"
              { id: t.table_reference.table_id, qualified_name: qualified_name, creation_time: t.creation_time }
            }
          else
            []
          end
        end

        def dry_run(billing_project_id, sql)
          resp = run(billing_project_id, sql, true)
          if resp[:error]
            resp
          else
            result = resp[:result]
            {
              error: false,
              total_bytes_processed: result.total_bytes_processed,
              cache_hit: result.cache_hit
            }
          end
        end

        def run(billing_project_id, sql, dry_run=false)
          query = Google::Apis::BigqueryV2::QueryRequest.new
          query.query = sql
          query.dry_run = dry_run
          query.use_legacy_sql = false
          begin
            {
              error: false,
              result: @bigquery_api.query_job(billing_project_id, query)
            }
          rescue Google::Apis::ClientError => err
            {
              error: true,
              message: err.message,
              client_error: err
            }
          end
        end

      end
    end
  end
end
