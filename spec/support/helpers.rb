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

  def upload_file(file_path, mime_type)
    file = Rack::Test::UploadedFile.new(Rails.root.join(file_path), mime_type)

    post v1_uploads_url(:host => 'test.localhost.lan'), :file => file, :api_key => @user.get_map_key

    JSON.parse(response.body)['file_uri']
  end

end
