require 'json'
require 'gibbon'
require 'addressable/uri'
require_relative '../base_oauth'
require_relative '../../../../../lib/carto/http/client'

module CartoDB
  module Datasources
    module Url
      # Note:
      # - MailChimp access tokens don't expire, no need to handle that logic
      class MailChimp < BaseOAuth

        # Required for all datasources
        DATASOURCE_NAME = 'mailchimp'

        AUTHORIZE_URI = 'https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id=%s&redirect_uri=%s'
        ACCESS_TOKEN_URI = 'https://login.mailchimp.com/oauth2/token'
        MAILCHIMP_METADATA_URI = 'https://login.mailchimp.com/oauth2/metadata'

        API_TIMEOUT_SECS = 60

        # Constructor
        # @param config Array
        # [
        #  'api_key'
        #  'timeout_minutes'
        # ]
        # @param user ::User
        # @throws UninitializedError
        # @throws MissingConfigurationError
        def initialize(config, user)
          super(config, user, %w{ app_key app_secret callback_url }, DATASOURCE_NAME)

          @user = user
          @app_key = config.fetch('app_key')
          @app_secret = config.fetch('app_secret')

          @http_timeout = config.fetch(:http_timeout, 600)
          @http_connect_timeout = config.fetch(:http_connect_timeout, 60)

          service_name = service_name_for_user(DATASOURCE_NAME, @user)
          placeholder = CALLBACK_STATE_DATA_PLACEHOLDER.sub('service', service_name).sub('user', @user.username)
          @callback_url = "#{config.fetch('callback_url')}?state=#{placeholder}"

          Gibbon::API.timeout = API_TIMEOUT_SECS
          Gibbon::API.throws_exceptions = true
          Gibbon::Export.timeout = API_TIMEOUT_SECS
          Gibbon::Export.throws_exceptions = false

          @access_token = nil
          @api_client = nil
        end

        # Factory method
        # @param config : {}
        # @param user : ::User
        # @return CartoDB::Datasources::Url::MailChimpLists
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
        # @return string : URL to navigate to for the authorization flow
        # @throws ExternalServiceError
        def get_auth_url(use_callback_flow=true)
          if use_callback_flow
            AUTHORIZE_URI % [@app_key, Addressable::URI.encode(@callback_url)]
          else
            raise ExternalServiceError.new("This datasource doesn't allows non-callback flows", DATASOURCE_NAME)
          end
        end

        # Validate authorization code and store token
        # @param auth_code : string
        # @return string : Access token
        # @throws ExternalServiceError
        def validate_auth_code(auth_code)
          raise ExternalServiceError.new("This datasource doesn't allows non-callback flows", DATASOURCE_NAME)
        end

        # Validates the authorization callback
        # @param params : mixed
        # @throws AuthError
        # @throws DataDownloadTimeoutError
        def validate_callback(params)
          code = params.fetch('code')
          if code.nil? || code == ''
            raise "Empty callback code"
          end

          token_call_params = {
            grant_type: 'authorization_code',
            client_id: @app_key,
            client_secret: @app_secret,
            code: code,
            redirect_uri: @callback_url
          }

          token_response = http_client.post(ACCESS_TOKEN_URI, http_options(token_call_params, :post))

          raise DataDownloadTimeoutError.new(DATASOURCE_NAME) if token_response.timed_out?

          unless token_response.code == 200
            raise "Bad token response: #{token_response.body.inspect} (#{token_response.code})"
          end
          token_data = ::JSON.parse(token_response.body)

          partial_access_token = token_data['access_token']

          # Afterwards, must do another call to metadata endpoint to retrieve API details
          # @see https://apidocs.mailchimp.com/oauth2/
          metadata_response = http_client.get(MAILCHIMP_METADATA_URI,http_options({}, :get, {
                                             'Authorization' => "OAuth #{partial_access_token}"}))

          raise DataDownloadTimeoutError.new(DATASOURCE_NAME) if metadata_response.timed_out?

          unless metadata_response.code == 200
            raise "Bad metadata response: #{metadata_response.body.inspect} (#{metadata_response.code})"
          end
          metadata_data = ::JSON.parse(metadata_response.body)

          # This specially formed token behaves as an API Key for client calls using API
          @access_token = "#{partial_access_token}-#{metadata_data['dc']}"
        rescue StandardError => ex
          raise AuthError.new("validate_callback(#{params.inspect}): #{ex.message}", DATASOURCE_NAME)
        end

        # Set the token
        # @param token string
        # @throws TokenExpiredOrInvalidError
        def token=(token)
          @access_token = token
          @api_client = Gibbon::API.new(@access_token)
        rescue Gibbon::MailChimpError => exception
          raise TokenExpiredOrInvalidError.new("token=() : #{exception.message} (API code: #{exception.code})",
                                               DATASOURCE_NAME)
        rescue StandardError => exception
          raise TokenExpiredOrInvalidError.new("token=() : #{exception.inspect}", DATASOURCE_NAME)
        end

        # Retrieve set token
        # @return string | nil
        def token
          @access_token
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        # @throws UninitializedError
        # @throws DataDownloadError
        def get_resources_list(filter=[])
          raise UninitializedError.new('No API client instantiated', DATASOURCE_NAME) unless @api_client.present?

          all_results = []
          offset = 0
          limit = 100
          total = nil

          begin
            response = @api_client.campaigns.list({
                                                start: offset,
                                                limit: limit
                                              })
            errors = response.fetch('errors', [])
            unless errors.empty?
              raise DataDownloadError.new("get_resources_list(): #{errors.inspect}", DATASOURCE_NAME)
            end

            total = response.fetch('total', 0).to_i if total.nil?

            response_data = response.fetch('data', [])
            response_data.each do |item|
              # Skip items without tracking
              all_results.push(format_activity_item_data(item)) if item['tracking']['opens']
            end

            offset += limit
          end while offset < total

          all_results
        rescue Gibbon::MailChimpError => exception
          raise DataDownloadError.new("get_resources_list(): #{exception.message} (API code: #{exception.code}",
                                      DATASOURCE_NAME)
        rescue StandardError => exception
          raise DataDownloadError.new("get_resources_list(): #{exception.inspect}", DATASOURCE_NAME)
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws UninitializedError
        # @throws DataDownloadError
        def get_resource(id)
          raise UninitializedError.new('No API client instantiated', DATASOURCE_NAME) unless @api_client.present?

          subscribers = {}
          contents = StringIO.new
          export_api = @api_client.get_exporter

          # 1) Retrieve campaign details
          campaign = get_resource_metadata(id)
          campaign_details = export_api.list({id: campaign[:list_id]})
          campaign = nil

          # 2) Retrieve subscriber activity
          # https://apidocs.mailchimp.com/export/1.0/campaignsubscriberactivity.func.php
          subscribers_activity = export_api.campaign_subscriber_activity({id: id})

          subscribers_activity.each { |line|
            store_subscriber_if_opened(line, subscribers)
          }
          subscribers_activity = nil

          # 3) Update campaign details with subscriber activity results
          # 4) anonymize data (inside list_json_to_csv)
          campaign_details.each_with_index { |line, index|
            contents.write list_json_to_csv(line, subscribers, index == 0)
          }

          contents.string
        rescue Gibbon::MailChimpError => exception
          raise DataDownloadError.new("get_resource(): #{exception.message} (API code: #{exception.code}",
                                      DATASOURCE_NAME)
        rescue StandardError => exception
          raise DataDownloadError.new("get_resource(): #{exception.inspect}", DATASOURCE_NAME)
        end

        # @param id string
        # @return Hash
        # @throws UninitializedError
        # @throws DataDownloadError
        def get_resource_metadata(id)
          raise UninitializedError.new('No API client instantiated', DATASOURCE_NAME) unless @api_client.present?

          item_data = {}

          # No metadata call at API, so just retrieve same info but from specific campaign id
          # https://apidocs.mailchimp.com/api/2.0/campaigns/list.php
          response = @api_client.campaigns.list({ filters: { campaign_id: id } })

          errors = response.fetch('errors', [])
          unless errors.empty?
            raise DataDownloadError.new("get_resources_list(): #{errors.inspect}", DATASOURCE_NAME)
          end
          response_data = response.fetch('data', [])

          response_data.each do |item|
            if item.fetch('id') == id
              item_data = format_activity_item_data(item)
            end
          end

          item_data
        rescue Gibbon::MailChimpError => exception
          raise DataDownloadError.new("get_resource_metadata(): #{exception.message} (API code: #{exception.code}",
                                      DATASOURCE_NAME)
        rescue StandardError => exception
          raise DataDownloadError.new("get_resource_metadata(): #{exception.inspect}", DATASOURCE_NAME)
        end

        # Retrieves current filters
        # @return {}
        def filter
          []
        end

        # Sets current filters
        # @param filter_data {}
        def filter=(filter_data=[])
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
          raise UninitializedError.new('No API client instantiated', DATASOURCE_NAME) unless @api_client.present?

          # Any call would do, we just want to see if communicates or refuses the token
          # This call is available to all roles
          response = @api_client.users.profile
          # 'errors' only appears in failure scenarios, while 'username' only if went ok
          response.fetch('errors', nil).nil? && !response.fetch('username', nil).nil?
        rescue StandardError => ex
          CartoDB.notify_exception(ex)
          false
        end

        # Revokes current set token
        def revoke_token
          # not supported
        end

        private

        def http_client
          @http_client ||= Carto::Http::Client.get('mailchimp')
        end

        def http_options(params={}, method=:get, extra_headers={})
          {
            method:           method,
            params:           method == :get ? params : {},
            body:             method == :post ? params : {},
            followlocation:   true,
            ssl_verifypeer:   false,
            headers:          {
                                'Accept' => 'application/json'
                              }.merge(extra_headers),
            ssl_verifyhost:   0,
            connecttimeout:  @http_connect_timeout,
            timeout:          @http_timeout
          }
        end

        # Formats all data to comply with our desired format
        # @param item_data Hash : Single item returned from MailChimp API
        # @return { :id, :title, :url, :service, :size }
        def format_activity_item_data(item_data)
          filename = item_data.fetch('title').gsub(' ', '_')
          {
            id:       item_data.fetch('id'),
            list_id:  item_data.fetch('list_id'),
            title:    "#{item_data.fetch('title')}",
            filename: "#{filename}.csv",
            service:  DATASOURCE_NAME,
            checksum: '',
            member_count: item_data.fetch('emails_sent'),
            size:     NO_CONTENT_SIZE_PROVIDED
          }
        end

        def store_subscriber_if_opened(input_fields='[]', subscribers)
          contents = ::JSON.parse(input_fields)
          contents.each { |subject, actions|
            unless actions.length == 0
              actions.each { |action|
                if action["action"] == "open"
                  subscribers[subject] = true
                end
                opened_action = true
              }
            end
          }
        end

        # @param contents String containing a JSON array of fields (data of campaign user/target)
        # @param subscribers Hash { subject => opened_email }
        # @param header_row Boolean
        # @return String Containing a CSV ready to dump to a file
        def list_json_to_csv(contents='[]', subscribers={}, header_row=false)
          # shorcut: Remove newlines and Anonymize email addresses before parsing to speed up
          contents = ::JSON.parse(contents.gsub("\n", ' ').gsub(/(\w|\.|\-)+@/, ""))

          opened_mail = !subscribers[contents[0]].nil?

          cleaned_contents = []
          #Once parsed, each row contains data like account code, company name, email, first name...
          contents.each_with_index { |field, index|
            # Remove double quotes to avoid CSV errors
            cleaned_contents[index] = "\"#{field.to_s.gsub('"', '""')}\""
          }
          cleaned_contents.push("\"#{header_row ? 'Opened' : opened_mail.to_s}\"")
          data = cleaned_contents.join(',')
          data << "\n"
        end

      end
    end
  end
end
