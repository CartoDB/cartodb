module HelperMethods

  def prepare_oauth_request(consumer, url, options={})
    url = URI.parse(url)
    http = Net::HTTP.new(url.host, url.port)
    if options[:form_data]
      req = Net::HTTP::Post.new(url.request_uri)
      req.set_form_data(options[:form_data])
    else
      req = Net::HTTP::Get.new(url.request_uri)
    end
    req.oauth!(http, consumer, options[:token])
    req
  end

end
