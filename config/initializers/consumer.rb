# Patch:
# overwrite the method create_http to make it don't verify the SSL request for two reasons
# - CartoDB certificate is broken
# - it's very slow to check this certificate each request
module OAuth
  class Consumer
    protected

    # Instantiates the http object
    def create_http(_url = nil)


      if !request_endpoint.nil?
       _url = request_endpoint
      end


      if _url.nil? || _url[0] =~ /^\//
        our_uri = URI.parse(site)
      else
        our_uri = URI.parse(_url)
      end


      if proxy.nil?
        http_object = Net::HTTP.new(our_uri.host, our_uri.port)
      else
        proxy_uri = proxy.is_a?(URI) ? proxy : URI.parse(proxy)
        http_object = Net::HTTP.new(our_uri.host, our_uri.port, proxy_uri.host, proxy_uri.port, proxy_uri.user, proxy_uri.password)
      end

      http_object.use_ssl = (our_uri.scheme == 'https')

      # if @options[:ca_file] || CA_FILE
      #   http_object.ca_file = @options[:ca_file] || CA_FILE
      #   http_object.verify_mode = OpenSSL::SSL::VERIFY_PEER
      #   http_object.verify_depth = 5
      # else
        http_object.verify_mode = OpenSSL::SSL::VERIFY_NONE
      # end
      http_object
    end
  end
end
