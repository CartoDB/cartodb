# encoding: utf-8

require 'boxr'
require_relative '../../../../../lib/carto/http/client'

module CartoDB
  module Datasources
    module Url
      class Box < BaseOAuth

        # Required for all providers
        DATASOURCE_NAME = 'box'

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
          super(config, user, %w{ application_name client_id client_secret callback_url box_host })

          raise UninitializedError.new('missing user instance', DATASOURCE_NAME)            if user.nil?

          @refresh_token = nil
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
          # TODO: maybe it can be replaced with download url
          false
        end

        # Return the url to be displayed or sent the user to to authenticate and get authorization code.
        # Older implementations had a use_callback_flow parameter that became deprecated. Not implemented.
        # @return string | nil
        def get_auth_url
          service_name = service_name_for_user(DATASOURCE_NAME, @user)
          state = CALLBACK_STATE_DATA_PLACEHOLDER.sub('user', @user.username).sub('service', service_name)
          url = Boxr::oauth_url(state,
                          host: config['box_host'],
                          response_type: "code",
                          scope: nil,
                          folder_id: nil,
                          client_id: config['client_id'])

          url.to_s
        end

        # Validate authorization code and store token
        # @param auth_code : string
        # @return string : Access token
        # Older implementations had a use_callback_flow parameter that became deprecated. Not implemented.
        # @throws AuthError
        def validate_auth_code(auth_code)
          tokens = get_tokens(auth_code)
          @refresh_token = tokens.refresh_token
          @access_token = tokens.access_token
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

        # Store token
        # Triggers generation of a valid access token for the lifetime of this instance
        # @param token string
        # @throws AuthError
        def token=(token)
          @access_token = token
        end

        # Retrieve token
        # @return string | nil
        def token
          @access_token
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        # @throws TokenExpiredOrInvalidError
        # @throws DataDownloadError
        def get_resources_list(filter=[])
          # Box doesn't have a way to "retrieve everything" but it supports whitespaces for multiple search terms
          result = client.search(SUPPORTED_EXTENSIONS.join(' '),
                 scope: nil,
                 file_extensions: nil,
                 created_at_range: nil,
                 updated_at_range: nil,
                 size_range: nil,
                 owner_user_ids: nil,
                 ancestor_folder_ids: nil,
                 content_types: nil,
                 type: nil,
                 limit: 200,
                 offset: 0)
          result.map{ |i| format_item_data(i) }.sort {|x,y| y[:updated_at] <=> x[:updated_at] }
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws TokenExpiredOrInvalidError
        # @throws DataDownloadError
        def get_resource(id)
          file = client.file_from_id(id)
          client.download_file(file)
        end

        # @param id string
        # @return Hash
        # @throws TokenExpiredOrInvalidError
        # @throws DataDownloadError
        # @throws NotFoundDownloadError
        def get_resource_metadata(id)
          result = client.file_from_id(id)
          raise NotFoundDownloadError.new("Retrieving file #{id} metadata: #{result.inspect}, should stop syncing", DATASOURCE_NAME) if result.nil?
          raise DataDownloadError.new("Retrieving file #{id} metadata: #{result.inspect}", DATASOURCE_NAME) if result.item_status != 'active'
          item_data = format_item_data(result)
          return item_data.to_hash
        end

        # Retrieves current filters
        # @return {}
        def filter
          @formats
        end

        # Sets current filters
        # @param filter_data {}
        def filter=(filter_data=[])
          @formats = filter_data
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
          # Any call would do, we just want to see if communicates or refuses the token
          result = client.search('test search')
          !result.nil?
        rescue Boxr::BoxrError => e
          if e.message =~ /invalid_token/
            CartoDB.notify_debug('Box invalid_token', self: self.inspect)
            false
          else
            CartoDB.notify_exception(e, self: self.inspect)
            raise e
          end
        end

        # Revokes current set token
        def revoke_token
        #  http_client = Carto::Http::Client.get('gdrive',
        #    connecttimeout: 60,
        #    timeout: 600
        #    )
        #  response = http_client.get("https://accounts.google.com/o/oauth2/revoke?token=#{token}")
        #    if response.code == 200
        #      true
        #    end
        #rescue => ex
        #  raise AuthError.new("revoke_token: #{ex.message}", DATASOURCE_NAME)
        end

        # Sets an error reporting component
        # @param component mixed
        def report_component=(component)
          nil
        end

        private

        def client
          @client ||= get_client(@user)
        end

        def get_client(user)
          token_refresh_callback = lambda do |access, refresh, identifier|
            some_method_that_saves_them(access, refresh)
          end

          carto_user = Carto::User.find(user.id)
          oauth = carto_user.oauth_for_service('box')
          access_token = oauth.token

          Boxr::Client.new(access_token,
                           refresh_token: nil,
                           client_id: config['client_id'],
                           client_secret: config['client_secret'],
                           &token_refresh_callback)
        end

        def get_tokens(code)
          tokens = Boxr::get_tokens(code = code,
                           grant_type: "authorization_code",
                           assertion: nil,
                           scope: nil,
                           username: nil,
                           client_id: config['client_id'],
                           client_secret: config['client_secret'])

          tokens
        end

        def get_code(user)
          url = get_auth_url

          http_client = Carto::Http::Client.get('box',
            connecttimeout: 60,
            timeout: 600
            )
          response = http_client.get(url)
          code = response[:body][:code]
          code
        end

        # Formats all data to comply with our desired format
        # @param item_data Hash : Single item returned from GDrive API
        # @return { :id, :title, :url, :service, :checksum, :size, :filename, :updated_at }
        def format_item_data(item_data)
          {
            id:           item_data.id,
            title:        item_data.name,
            service:      DATASOURCE_NAME,
            checksum:     checksum_of(item_data.fetch('modified_at')),
            url: client.download_url(item_data),
            filename: item_data.name,
            size: item_data.size.to_i,
            updated_at: DateTime.rfc3339(item_data.content_modified_at)
          }
        end

      end
    end
  end
end
