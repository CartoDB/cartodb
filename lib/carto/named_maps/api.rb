require_relative 'template'
require_relative '../http/client'
require_dependency 'carto/named_maps/template'

module Carto
  module NamedMaps
    class Api

      include ::LoggerHelper

      HTTP_CONNECT_TIMEOUT_SECONDS = 45
      HTTP_REQUEST_TIMEOUT_SECONDS = 60
      RETRY_TIME_SECONDS = 2
      MAX_RETRY_ATTEMPTS = 3
      MAX_NAMED_MAPS_TO_CLEAN = 100

      attr_accessor :user, :visualization

      def initialize(visualization)
        @visualization = visualization
        @user = visualization.user
        @named_map_template = Carto::NamedMaps::Template.new(visualization)
      end

      def index
        stats_aggregator.timing('carto-named-maps-api.index') do
          response = stats_aggregator.timing('call') do
            http_client.get(url, request_params)
          end

          if response.code.to_s.match?(/^2/)
            ::JSON.parse(response.response_body).deep_symbolize_keys
          else
            log_response(response, 'index')
          end
        end
      end

      def create
        stats_aggregator.timing('carto-named-maps-api.create') do
          params = request_params
          params[:body] = @named_map_template.to_json

          response = http_client.post(url, params)

          response_code = response.code
          if response_code.to_s.match?(/^2/)
            response_body = ::JSON.parse(response.response_body).deep_symbolize_keys
            if response_body.key?(:limit_message)
              # Send message to support and clean some named_maps
              ReporterMailer.named_maps_near_the_limit(response_body[:limit_message]).deliver_now
              tables = Carto::UserTable.where(user_id: user.id, privacy: 0)
                                       .limit(MAX_NAMED_MAPS_TO_CLEAN)
                                       .order('updated_at')
              named_maps_ids = tables.map { |t| "tpl_#{t.visualization.id.tr('-', '_')}" }
              urls = named_maps_ids.map { |id| url(template_name: id) }
              ::Resque.enqueue(
                ::Resque::UserJobs::NamedMapsLimitsJobs::CleanNamedMaps,
                { urls: urls, request_params: request_params }
              )
            end
            response_body
          elsif response_code != 409 # Ignore when max number of templates is reached
            log_response(response, 'create')
          end
        end
      end

      def show
        stats_aggregator.timing('carto-named-maps-api.show') do
          response = stats_aggregator.timing('call') do
            url = url(template_name: @named_map_template.name)

            response = http_client.get(url, request_params)
          end

          response_code = response.code
          if response_code.to_s.match?(/^2/)
            ::JSON.parse(response.response_body).deep_symbolize_keys
          else
            log_response(response, 'show') unless response_code == 404
          end
        end
      end

      def update(retries: 0)
        stats_aggregator.timing('carto-named-maps-api.update') do
          params = request_params
          params[:body] = @named_map_template.to_json

          response = http_client.put(url(template_name: @named_map_template.name), params)

          response_code_string = response.code.to_s
          if response_code_string.match?(/^2/)
            ::JSON.parse(response.response_body).deep_symbolize_keys
          elsif (response_code_string.match?(/^5/) || response.code == 429) && retries < MAX_RETRY_ATTEMPTS
            sleep(RETRY_TIME_SECONDS**retries)
            update(retries: retries + 1)
          else
            log_response(response, 'update')
          end
        end
      end

      def destroy(retries: 0)
        stats_aggregator.timing('carto-named-maps-api.destroy') do
          url = url(template_name: @named_map_template.name)
          response = http_client.delete(url, request_params)

          response_code_string = response.code.to_s
          if response_code_string.match?(/^2/)
            response.response_body
          elsif (response_code_string.match?(/^5/) || response.code == 429) && retries < MAX_RETRY_ATTEMPTS
            sleep(RETRY_TIME_SECONDS**retries)
            destroy(retries: retries + 1)
          else
            log_response(response, 'destroy') unless response.code == 404
          end
        end
      end

      def upsert
        show ? update : create
      end

      private

      def stats_aggregator
        @@stats_aggregator_instance ||= CartoDB::Stats::EditorAPIs.instance
      end

      def url(template_name: '')
        username = user.username
        user_url = CartoDB.subdomainless_urls? ? "/user/#{username}" : ''

        "#{protocol}://#{host(username)}:#{port}#{user_url}/api/v1/map/named/#{template_name}?api_key=#{user.api_key}"
      end

      def request_params
        {
          headers: headers(user.username),
          ssl_verifypeer: ssl_verifypeer,
          ssl_verifyhost: ssl_verifyhost,
          followlocation: true,
          connecttimeout: HTTP_CONNECT_TIMEOUT_SECONDS,
          timeout: HTTP_REQUEST_TIMEOUT_SECONDS
        }
      end

      def headers(username)
        @headers ||= {
          'content-type': 'application/json',
          'host': domain(username)
        }
      end

      def domain(username)
        return @domain if @domain

        config_domain = Cartodb.get_config(:tiler, 'internal', 'domain')

        CartoDB.subdomainless_urls? ? config_domain : "#{username}.#{config_domain}"
      end

      def port
        @port ||= Cartodb.get_config(:tiler, 'internal', 'port')
      end

      def protocol
        @protocol ||= Cartodb.get_config(:tiler, 'internal', 'protocol')
      end

      def ssl_verifypeer
        @verifycert ||= Cartodb.get_config(:tiler, 'internal', 'verifycert')
      end

      def ssl_verifyhost
        ssl_verifypeer ? 2 : 0
      end

      def host(username)
        return @host if @host

        config_host = Cartodb.get_config(:tiler, 'internal', 'host')

        @host ||= config_host.blank? ? domain(username) : config_host
      end

      def http_client
        @http_client ||= Carto::Http::Client.get('named_maps')
      end

      def log_response(response, action)
        # Suppressed for now, we have to work on this trace, it's only
        # generating noise without any relevant information.
        #   log_warning(
        #     message: 'Error in named maps API',
        #     current_user: user,
        #     visualization_id: visualization.id,
        #     action: action,
        #     request_url: response.request.url,
        #     status: response.code,
        #     response_body: response.body
        #   )
        # rescue Encoding::UndefinedConversionError => e
        #   # Hotfix for preventing https://rollbar.com/carto/CartoDB/items/41457 until we find the root cause
        #   # https://cartoteam.slack.com/archives/CEQLWTW9Z/p1599134417001900
        #   # https://app.clubhouse.io/cartoteam/story/101908/fix-encoding-error-while-logging-request
        #   # Rollbar.error(e)
      end

      def log_context
        super.merge(request_id: Carto::Common::CurrentRequest.request_id, component: 'cartodb.named-maps-client')
      end
    end
  end
end
