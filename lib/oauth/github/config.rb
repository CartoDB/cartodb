module Carto
  module Github
    class Config
      attr_reader :client_id, :client_secret, :state

      def self.instance(state, base_callback_url, plan: nil, after: nil)
        Github::Config.new(state, base_callback_url, plan, after) if CartoDB.get_config(:oauth, 'github').present?
      end

      def initialize(state, base_callback_url, plan, after)
        @client_id = CartoDB.get_config(:oauth, 'github', 'client_id')
        @client_secret = CartoDB.get_config(:oauth, 'github', 'client_secret')
        @state = state
        @plan = plan
        @after = after
        @base_callback_url = base_callback_url
      end

      def github_url
        url = "https://github.com/login/oauth/authorize?client_id=#{client_id}&state=#{Rack::Utils.escape(state)}&scope=user"

        params = {}
        params[:plan] = @plan if @plan
        params[:after] = @after if @after
        redirect_uri = "#{@base_callback_url}?#{URI.encode_www_form(params)}" unless params.empty?
        url += "&redirect_uri=#{CGI.escape(redirect_uri)}" if redirect_uri

        url
      end
    end
  end
end
