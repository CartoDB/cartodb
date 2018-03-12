# Module to trigger requests to CARTO. It's meant to be replaced by a Swagger client
# as soon as swagger-codegen supports v3 and we release the first version of the spec.
module CartoAPI
  class JsonClient
    def initialize(http_client_tag: 'carto-api-client', scheme: 'https', base_domain: 'carto.com', port: nil)
      @http_client_tag = http_client_tag
      @base_domain = base_domain
      @scheme = scheme
      @port = port
    end

    def get_visualization_v1(username:, name:, params: {})
      JSON.parse(get(carto_url(username, "/api/v1/viz/#{name}", params: params1)).body)
    end

    def get_visualizations_v1(username:, params: {})
      JSON.parse(get(carto_url(username, '/api/v1/viz', params: params1)).body)
    end

    # Deprecated
    def get_visualizations_v1_from_url(url)
      get(url)
    end

    private

    CONNECT_TIMEOUT = 45
    DEFAULT_TIMEOUT = 60
    NO_PAGE_LIMIT = 100000

    def carto_url(username, path, params: nil)
      uri = URI::HTTP.build(host: base_url(username), path: path, query: params && params.to_query)
      uri.scheme = @scheme if @scheme
      uri.port = @port if @port
      uri.to_s
    end

    def base_url(username)
      "#{username}.#{@base_domain}"
    end

    def get(url)
      http_client = Carto::Http::Client.get(@http_client_tag, log_requests: true)
      request = http_client.request(
        url,
        method: :get,
        connecttimeout: CONNECT_TIMEOUT,
        timeout: DEFAULT_TIMEOUT,
        params: { per_page: NO_PAGE_LIMIT },
        followlocation: true
      )
      request.run
    end
  end
end
