module Carto
  module Github
    class Config
      attr_reader :client_id, :client_secret, :state

      def self.instance(state, after: nil)
        Github::Config.new(state, after) if Cartodb.get_config(:oauth, 'github').present?
      end

      def initialize(state, after)
        @client_id = Cartodb.get_config(:oauth, 'github', 'client_id')
        @client_secret = Cartodb.get_config(:oauth, 'github', 'client_secret')
        @state = state
        @after = after
      end

      def github_url(controller)
        escaped_state = Rack::Utils.escape(state)
        url = "https://github.com/login/oauth/authorize?client_id=#{client_id}&state=#{escaped_state}&scope=user"

        params = {}
        params[:after] = @after if @after
        redirect_uri = "#{base_callback_url(controller)}?#{URI.encode_www_form(params)}" unless params.empty?
        url += "&redirect_uri=#{CGI.escape(redirect_uri)}" if redirect_uri

        url
      end

      def base_callback_url(controller)
        if Cartodb::Central.sync_data_with_cartodb_central?
          Cartodb::Central.new.host + '/github'
        else
          CartoDB.url(controller, 'github')
        end
      end
    end
  end
end
