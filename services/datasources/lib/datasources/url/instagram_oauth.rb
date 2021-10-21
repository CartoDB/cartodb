require "instagram"

module CartoDB
  module Datasources
    module Url
      class InstagramOAuth < BaseOAuth

        # Required for all datasources
        DATASOURCE_NAME = 'instagram'

        FORMAT_ALL_MEDIA = 'all_media'

        # Constructor
        # @param config Array
        # [
        #  'app_key'
        #  'app_secret'
        #  'callback_url'
        # ]
        # @param user ::User
        # @throws UninitializedError
        # @throws MissingConfigurationError
        def initialize(config, user)
          super(config, user, %w{ app_key app_secret callback_url }, DATASOURCE_NAME)

          @user         = user
          @app_key      = config.fetch('app_key')
          @app_secret   = config.fetch('app_secret')

          raise ServiceDisabledError.new(DATASOURCE_NAME, @user.username) unless @user.has_feature_flag?('instagram_import')

          service_name = service_name_for_user(DATASOURCE_NAME, @user)
          placeholder = CALLBACK_STATE_DATA_PLACEHOLDER.sub('service', service_name).sub('user', @user.username)
          @callback_url = "#{config.fetch('callback_url')}?state=#{placeholder}"

          self.filter   = []
          @access_token = nil
          @auth_flow    = nil
          @client       = nil
        end

        # Factory method
        # @param config : {}
        # @param user : ::User
        # @return CartoDB::Datasources::Url::InstagramOAuth
        def self.get_new(config, user)
          return new(config, user)
        end

        # If will provide a url to download the resource, or requires calling get_resource()
        # @return bool
        def providers_download_url?
          false
        end

        # Return the url to be displayed or sent the user to to authenticate and get authorization code
        # @param use_callback_flow : bool
        # @throws AuthError
        def get_auth_url(use_callback_flow=true)
          # TODO: Add CSRF here (http://instagram.com/developer/authentication/)
          Instagram.authorize_url({
            client_id:      @app_key,
            response_type:  'code',
            redirect_uri:   @callback_url
          })
        rescue StandardError => ex
          raise AuthError.new("get_auth_url(#{use_callback_flow}): #{ex.message}", DATASOURCE_NAME)
        end

        # Validates the authorization callback
        # @param params : mixed
        def validate_callback(params)
          response = Instagram.get_access_token(params[:code], {
            client_id:      @app_key,
            client_secret:  @app_secret,
            redirect_uri:   @callback_url
          })
          @access_token = response.access_token
          @client = Instagram.client(access_token: @access_token)
          @access_token
        rescue StandardError => ex
          raise AuthError.new("validate_callback(#{params.inspect}): #{ex.message}", DATASOURCE_NAME)
        end

        # Set the token
        # @param token string
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        def token=(token)
          @access_token = token
          @client = Instagram.client(access_token: @access_token)
        rescue StandardError => ex
          handle_error(ex, "token= : #{ex.message}")
        end

        # Retrieve set token
        # @return string | nil
        def token
          @access_token
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        # @throws DataDownloadError
        def get_resources_list(filter=[])
          [
            {
              id:       FORMAT_ALL_MEDIA,
              title:    'All your photos and videos',
              url:      'All your photos and videos',
              service:  DATASOURCE_NAME,
              checksum: '',
              size:     NO_CONTENT_SIZE_PROVIDED
            }
          ]
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        # @throws DataDownloadError
        def get_resource(id)

          contents = [
            field_to_csv('thumbnail'),
            field_to_csv('image'),
            field_to_csv('link'),
            field_to_csv('type'),
            field_to_csv('lat'),
            field_to_csv('lon'),
            field_to_csv('location_id'),
            field_to_csv('location_name'),
            field_to_csv('caption'),
            field_to_csv('comments_count'),
            field_to_csv('likes_count'),
            field_to_csv('tags'),
            field_to_csv('created_time')
          ].join(',') << "\n"

          max_id = nil

          begin
            batch_contents, max_id = get_resource_page(id, max_id)
            contents << batch_contents
          end while !max_id.nil?

          contents
        end

        # @param id string
        # @return Hash
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        # @throws DataDownloadError
        def get_resource_metadata(id)
          {
            id:       FORMAT_ALL_MEDIA,
            filename: "#{DATASOURCE_NAME}_#{@client.user.username}.csv",
            size:     NO_CONTENT_SIZE_PROVIDED
          }
        rescue StandardError => ex
          handle_error(ex, "get_resource_metadata() #{id}: #{ex.message}")
        end

        # Retrieves current filters
        # @return {}
        def filter
          {}
        end

        # Sets current filters
        # @param filter_data {}
        def filter=(filter_data=[])
          nil
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
          # checking if metadata is returned, if so token
          # is valid, if not it is invalid
          response = get_resource_metadata(DATASOURCE_NAME)
          if response[:id]
            true
          end
        rescue StandardError => ex
          false
        end

        # Revokes current set token
        def revoke_token
          # TODO: See how to check this
          true
        rescue StandardError => ex
          raise AuthError.new("revoke_token: #{ex.message}", DATASOURCE_NAME)
        end

        private

        def field_to_csv(field)
          '"' + field.to_s.gsub('"', '""').gsub("\\n", ' ').gsub("\x0D", ' ').gsub("\x0A", ' ').gsub("\0", '')
                     .gsub("\\", ' ') + '"'
        end

        # @param resource_id String
        # @para max_id Integer|nil Max media id retrieved (used to paginate)
        def get_resource_page(resource_id, max_id=nil)
          contents = ''

          data = { count: 30 }
          data[:max_id] = max_id unless max_id.nil?

          items = @client.user_recent_media(data)
          new_max_id = items.pagination.next_max_id

          items.each do |item|
            if item.location.nil?
              lat = lon = location_id = location_name = nil
            else
              lat = item.location.latitude
              lon = item.location.longitude
              location_id = item.location.id
              location_name = item.location.name
            end
            caption = item.caption.nil? ? '' : item.caption.text

            contents << [
              field_to_csv(item.images.thumbnail.url),
              field_to_csv(item.images.standard_resolution.url),
              field_to_csv(item.link),
              field_to_csv(item.type),
              field_to_csv(lat),
              field_to_csv(lon),
              field_to_csv(location_id),
              field_to_csv(location_name),
              field_to_csv(caption),
              field_to_csv(item.comments['count']),
              field_to_csv(item.likes['count']),
              field_to_csv(item.tags.join(',')),
              field_to_csv(item.created_time)
            ].join(',') << "\n"
          end

          [ contents, new_max_id ]
        rescue StandardError => ex
          handle_error(ex, "get_resource() #{resource_id}: #{ex.message}")
        end

        # Handles
        # @param original_exception mixed
        # @param message string
        # @throws TokenExpiredOrInvalidError
        # @throws AuthError
        # @throws mixed
        def handle_error(original_exception, message)
          # TODO: Implement
          raise original_exception
        end

      end
    end
  end
end
