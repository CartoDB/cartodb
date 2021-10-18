require_relative '../../../../../lib/carto/http/client'

module CartoDB
  module Datasources
    module Url
      # BoxAPI module is a replacement for Boxr, which requires Ruby >= 2.
      # Most of this code has been extracted from Boxr.
      # This should be migrated when we upgrade to Ruby 2.
      module BoxAPI
        class ExpiredTokenError < StandardError; end

        def self.oauth_url(state, options = {})
          host = options.fetch(:host, "app.box.com")
          response_type = options.fetch(:response_type, "code")
          scope = options[:scope]
          folder_id = options[:folder_id]
          client_id = options[:client_id]

          template = Addressable::Template.new("https://{host}/api/oauth2/authorize{?query*}")

          query = { "response_type" => "#{response_type}", "state" => "#{state}", "client_id" => "#{client_id}" }
          query["scope"] = "#{scope}" unless scope.nil?
          query["folder_id"] = "#{folder_id}" unless folder_id.nil?

          template.expand("host" => "#{host}", "query" => query)
        end

        def self.get_tokens(code, options = {})
          grant_type = options[:grant_type]
          assertion = options[:assertion]
          scope = options[:scope]
          username = options[:username]
          client_id = options[:client_id]
          client_secret = options[:client_secret]

          uri = "https://api.box.com/oauth2/token"
          body = "grant_type=#{grant_type}&client_id=#{client_id}&client_secret=#{client_secret}"
          body = body + "&code=#{code}" unless code.nil?
          body = body + "&scope=#{scope}" unless scope.nil?
          body = body + "&username=#{username}" unless username.nil?
          body = body + "&assertion=#{assertion}" unless assertion.nil?

          auth_post(uri, body)
        end

        def self.refresh_tokens(refresh_token, options = {})
          client_id = options[:client_id]
          client_secret = options[:client_secret]

          uri = "https://api.box.com/oauth2/token"
          body = "grant_type=refresh_token&refresh_token=#{refresh_token}&client_id=#{client_id}&client_secret=#{client_secret}"

          auth_post(uri, body)
        end

        def self.auth_post(uri, body, json_body = true)
          uri = Addressable::URI.encode(uri)

          res = post(uri, body: body)

          if res.response_code == 200
            json_body ? JSON.parse(res.response_body) : res.response_body
          else
            handle_error_response(res)
          end
        end

        def self.handle_error_response(res)
          body_json = JSON.parse(res.response_body)

          if body_json['error'] == 'invalid_grant'
            raise ExpiredTokenError.new(body_json.fetch('error_description', 'Expired token'))
          else
            raise "Box Error status: #{res.response_code}, body: #{res.response_body}, headers: #{res.response_headers}"
          end
        rescue StandardError => e
          CartoDB.notify_exception(e, self: inspect, response: res.inspect)
          raise e
        end

        def self.post(uri, options = {})
          http_client = Carto::Http::Client.get('box',
                                                connecttimeout: 60,
                                                timeout: 600
                                               )
          http_client.post(uri.to_s, options)
        end

        def self.get(uri, options = {})
          query = options[:query]
          header = options[:header]
          follow_redirect = options[:follow_redirect]

          http_client = Carto::Http::Client.get('box',
                                                connecttimeout: 60,
                                                timeout: 600)
          response = http_client.get(uri.to_s, headers: header, followlocation: follow_redirect, params: query)
          response
        end
      end

      module BoxAPI
        class Client

          API_URI = "https://api.box.com/2.0"
          SEARCH_URI = "#{API_URI}/search"
          FILES_URI = "#{API_URI}/files"

          def initialize(access_token, options = {})
            client_id = options[:client_id]
            client_secret = options[:client_secret]

            @access_token = access_token
            if @access_token.nil?
              raise CartoDB::Datasources::TokenExpiredOrInvalidError.new('Access token cannot be nil', DATASOURCE_NAME)
            end

            @client_id = client_id
            @client_secret = client_secret
          end

          def search(query, options = {})
            scope = options[:scope]
            file_extensions = options[:file_extensions]
            created_at_range = options[:created_at_range]
            updated_at_range = options[:updated_at_range]
            size_range = options[:size_range]
            owner_user_ids = options[:owner_user_ids]
            ancestor_folder_ids = options[:ancestor_folder_ids]
            content_types = options[:content_types]
            type = options[:type]
            limit = options.fetch(:limit, 30)
            offset = options.fetch(:offset, 0)

            query = { query: query }
            query[:scope] = scope unless scope.nil?
            query[:file_extensions] = file_extensions unless file_extensions.nil?
            query[:created_at_range] = created_at_range unless created_at_range.nil?
            query[:updated_at_range] = updated_at_range unless updated_at_range.nil?
            query[:size_range] = size_range unless size_range.nil?
            query[:owner_user_ids] = owner_user_ids unless owner_user_ids.nil?
            query[:ancestor_folder_ids] = ancestor_folder_ids unless ancestor_folder_ids.nil?
            query[:content_types] = content_types unless content_types.nil?
            query[:type] = type unless type.nil?
            query[:limit] = limit unless limit.nil?
            query[:offset] = offset unless offset.nil?

            if offset.present? && offset > 0
              # external pagination
              results, _response = get(SEARCH_URI, query: query)
              return results['entries']
            end

            entries = []
            offset = 0
            loop do
              query[:offset] = offset
              query[:limit] = limit - entries.size if limit.present? # possibly capped by the Box API
              results, _response = get(SEARCH_URI, query: query)
              new_entries = results['entries']
              entries += new_entries
              offset += new_entries.size
              break if entries.size >= results['total_count'] || entries.size >= limit
            end
            entries
          end

          def download_url(file, options = {})
            version = options[:version]

            download_file(file, version: version, follow_redirect: false)
          end

          def download_file(file, options = {})
            version = options[:version]
            follow_redirect = options.fetch(:follow_redirect, true)

            file_id = ensure_id(file)
            begin
              uri = "#{FILES_URI}/#{file_id}/content"
              query = {}
              query[:version] = version unless version.nil?

              # Boxr didn't have 200
              _body_json, response = get(uri, query: query, success_codes: [302, 202, 200], follow_redirect: false, process_response: false)

              if response.response_code == 302
                location = response.header['Location'][0]

                if follow_redirect
                  file, response = get(location, process_response: false)
                else
                  return location # simply return the url
                end
              elsif response.response_code == 202
                retry_after_seconds = response.header['Retry-After'][0]
                sleep retry_after_seconds.to_i
              elsif response.response_code == 200
                file = response.response_body
              end
            end until file

            file
          end

          FOLDER_AND_FILE_FIELDS = [:type, :id, :sequence_id, :etag, :name, :created_at, :modified_at, :description,
                                    :size, :path_collection, :created_by, :modified_by, :trashed_at, :purged_at,
                                    :content_created_at, :content_modified_at, :owned_by, :shared_link,
                                    :folder_upload_email,
                                    :parent, :item_status, :item_collection, :sync_state, :has_collaborations,
                                    :permissions, :tags,
                                    :sha1, :shared_link, :version_number, :comment_count, :lock, :extension,
                                    :is_package,
                                    :expiring_embed_link, :can_non_owners_invite]
          FOLDER_AND_FILE_FIELDS_QUERY = FOLDER_AND_FILE_FIELDS.join(',')

          def file_from_id(file_id, fields = [])
            file_id = ensure_id(file_id)
            uri = "#{FILES_URI}/#{file_id}"
            query = build_fields_query(fields, FOLDER_AND_FILE_FIELDS_QUERY)
            file, _response = get(uri, query: query)
            file
          end

          # Required for all providers
          DATASOURCE_NAME = 'box'

          def revoke_tokens(token)
            uri = "https://api.box.com/oauth2/revoke"
            body = "client_id=#{@client_id}&client_secret=#{@client_secret}&token=#{token}"

            BoxAPI::auth_post(uri, body, false)
          rescue StandardError => ex
            raise AuthError.new("revoke_token: #{ex.message}", DATASOURCE_NAME)
          end

          private

          def build_fields_query(fields, all_fields_query)
            if fields == :all
              { fields: all_fields_query }
            elsif fields.is_a?(Array) && fields.length > 0
              { fields: fields.join(',') }
            else
              {}
            end
          end

          def ensure_id(item)
            return item if item.class == String || item.class == Integer || item.nil?
            return item.id if item.respond_to?(:id)
            return item['id'] if item.class == Hash
            raise "Expecting an id of class String or Integer, or object that responds to :id"
          end

          def get(uri, options = {})
            query = options[:query]
            success_codes = options.fetch(:success_codes, [200])
            process_response = options.fetch(:process_response, true)
            if_match = options[:if_match]
            box_api_header = options[:box_api_header]
            follow_redirect = options.fetch(follow_redirect, true)

            headers = standard_headers
            headers['If-Match'] = if_match unless if_match.nil?
            headers['BoxApi'] = box_api_header unless box_api_header.nil?

            res = BoxAPI::get(uri, query: query, header: headers, follow_redirect: follow_redirect)

            check_response_status(res, success_codes)

            if process_response
              return JSON.parse(res.response_body)
            else
              return res.response_body, res
            end
          end

          def check_response_status(res, success_codes)
            unless success_codes.include?(res.response_code)
              raise "BoxError status: #{res.response_code}, body: #{res.response_body}, header: #{res.response_headers}"
            end
          end

          def standard_headers
            { "Authorization" => "Bearer #{@access_token}" }
          end

        end
      end

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
          super(config, user, %w{ application_name client_id client_secret box_host }, DATASOURCE_NAME)

          raise UninitializedError.new('missing user instance', DATASOURCE_NAME) if user.nil?

          @access_token = nil
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
          false
        end

        # Return the url to be displayed or sent the user to to authenticate and get authorization code.
        # Older implementations had a use_callback_flow parameter that became deprecated. Not implemented.
        # @return string | nil
        def get_auth_url
          service_name = service_name_for_user(DATASOURCE_NAME, @user)
          state = CALLBACK_STATE_DATA_PLACEHOLDER.sub('service', service_name).sub('user', @user.username)
          BoxAPI::oauth_url(state,
                            host: config['box_host'],
                            response_type: "code",
                            scope: nil,
                            folder_id: nil,
                            client_id: config['client_id']).to_s
        end

        # Validates authorization code, sets access and refresh tokens for current instance and stores (refresh) token
        # @param auth_code : string
        # @return string : Refresh token
        # Older implementations had a use_callback_flow parameter that became deprecated. Not implemented.
        # @throws AuthError
        def validate_auth_code(auth_code)
          set_tokens(get_tokens(auth_code))
          @refresh_token
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

        # Store (refresh) token. If it's not valid both access_token and refresh_token will be nil.
        # Triggers generation of a valid access token for the lifetime of this instance
        # @param token string
        # @throws AuthError
        def token=(token)
          set_tokens(get_fresh_tokens(token))
        rescue CartoDB::Datasources::Url::BoxAPI::ExpiredTokenError => e
          CartoDB.notify_exception(e, self: inspect, token: token)
          set_tokens('access_token' => nil, 'refresh_token' => nil)
        end

        # Retrieve (refresh) token
        # @return string | nil
        def token
          @refresh_token
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        # @throws TokenExpiredOrInvalidError
        # @throws DataDownloadError
        def get_resources_list(filter = [])
          self.filter = filter

          # Box doesn't have a way to "retrieve everything" but it supports whitespaces for multiple search terms
          result = client.search(supported_extensions.join(' '),
                                 scope: nil,
                                 file_extensions: nil,
                                 created_at_range: nil,
                                 updated_at_range: nil,
                                 size_range: nil,
                                 owner_user_ids: nil,
                                 ancestor_folder_ids: nil,
                                 content_types: nil,
                                 type: nil,
                                 limit: 2000,
                                 offset: 0)

          result = result.map { |i| format_item_data(i) }.sort { |x, y| y[:updated_at] <=> x[:updated_at] }

          unless @formats.nil? || @formats.empty?
            result = result.select { |item| item[:filename] =~ /.*(#{@formats.join(')|(')})$/i }
          end

          result
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

          if result.nil?
            message = "Retrieving file #{id} metadata: #{result.inspect}, should stop syncing"
            raise NotFoundDownloadError.new(message, DATASOURCE_NAME)
          end

          if result['item_status'] != 'active'
            raise DataDownloadError.new("Retrieving file #{id} metadata: #{result.inspect}", DATASOURCE_NAME)
          end

          format_item_data(result)
        end

        # Retrieves current filters
        # @return {}
        def filter
          @formats
        end

        # Sets current filters
        # @param filter_data {}
        def filter=(filter_data = [])
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
        # Not implemented
        def data_import_item=(_value)
          nil
        end

        # Checks if token is still valid or has been revoked
        # @return bool
        # @throws AuthError
        def token_valid?
          raise 'invalid_token' unless token

          # Any call would do, we just want to see if communicates or refuses the token
          result = client.search('test search')
          !result.nil?
        rescue StandardError => e
          if e.message =~ /invalid_token/
            CartoDB.notify_debug('Box invalid_token', self: inspect)
            false
          else
            CartoDB.notify_exception(e, self: inspect)
            raise e
          end
        end

        # Revokes current set token
        def revoke_token
          client.revoke_tokens(token)
        end

        private

        def set_tokens(tokens)
          @access_token = tokens['access_token']
          @refresh_token = tokens['refresh_token']
        end

        def client
          @client ||= get_client
        end

        def get_client
          BoxAPI::Client.new(@access_token,
                             client_id: config['client_id'],
                             client_secret: config['client_secret'])
        end

        def get_tokens(code)
          BoxAPI::get_tokens(code,
                             grant_type: "authorization_code",
                             assertion: nil,
                             scope: nil,
                             username: nil,
                             client_id: config['client_id'],
                             client_secret: config['client_secret'])
        end

        def get_fresh_tokens(refresh_token)
          tokens = BoxAPI::refresh_tokens(refresh_token,
                                          client_id: config['client_id'],
                                          client_secret: config['client_secret'])
          # Box refresh tokens can only be used once
          update_user_oauth(tokens['refresh_token'])
          tokens
        end

        def update_user_oauth(refresh_token)
          carto_user = Carto::User.find(@user.id)
          oauth = carto_user.oauth_for_service('box')
          if oauth
            oauth.token = refresh_token
            oauth.save
          end
        end

        # Formats all data to comply with our desired format
        # @param item_data Hash : Single item returned from GDrive API
        # @return { :id, :title, :url, :service, :checksum, :size, :filename, :updated_at }
        def format_item_data(item_data)
          {
            id:           item_data['id'],
            title:        item_data['name'],
            service:      DATASOURCE_NAME,
            checksum:     checksum_of(item_data.fetch('modified_at')),
            filename: item_data['name'],
            size: item_data['size'].to_i,
            updated_at: DateTime.rfc3339(item_data['content_modified_at'])
          }
        end

      end
    end
  end
end
