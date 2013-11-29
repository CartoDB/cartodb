class Fixnum
  def success?; self == 200; end
end

#encoding: UTF-8
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
  end

  def serve_file(file_path, options = {})
    require 'webrick'
    server = WEBrick::HTTPServer.new(
      :AccessLog       => [],
      :Logger          => WEBrick::Log::new("/dev/null", 7), #comment this line if weird things happen
      :Port            => 9999,
      :DocumentRoot    => File.dirname(file_path),
      :RequestCallback => Proc.new() { |req, res|
        options[:headers].each { |k, v| res[k] = v } if options[:headers].present?
        if options[:headers].present? && options[:headers]['content-type'].present?
          res.content_type = options[:headers]['content-type']
        end
      }
    )

    trap("INT"){ server.shutdown }

    a = Thread.new { server.start }
    
    begin
      yield "http://localhost:9999/#{File.basename(file_path)}" if block_given?
    rescue => e
      raise e
    ensure
      b = Thread.new { server.shutdown }

      b.join
      a.join
    end
  end


  def get_json(path, params = {}, headers ={}, &block)
    get path, params, headers
    response_parsed = response.body.blank? ? {} : Yajl::Parser.new.parse(response.body)
    yield OpenStruct.new(:body => (response_parsed.is_a?(Hash) ? response_parsed.symbolize_keys : response_parsed), :status => response.status, :headers => response.headers) if block_given?
  end

  def put_json(path, params = {}, headers ={}, &block)
    put path, params, headers
    response_parsed = response.body.blank? ? {} : Yajl::Parser.new.parse(response.body)
    yield OpenStruct.new(:body => (response_parsed.is_a?(Hash) ? response_parsed.symbolize_keys : response_parsed), :status => response.status, :headers => response.headers) if block_given?
  end

  def post_json(path, params = {}, headers ={}, &block)
    post path, params, headers
    response_parsed = response.body.blank? ? {} : Yajl::Parser.new.parse(response.body)
    yield OpenStruct.new(:body => (response_parsed.is_a?(Hash) ? response_parsed.symbolize_keys : response_parsed), :status => response.status, :headers => response.headers) if block_given?
  end

  def delete_json(path, headers ={}, &block)
    delete path, {}, headers
    response_parsed = response.body.blank? ? {} : Yajl::Parser.new.parse(response.body)
    yield OpenStruct.new(:body => (response_parsed.is_a?(Hash) ? response_parsed.symbolize_keys : response_parsed), :status => response.status, :headers => response.headers) if block_given?
  end

  def parse_json(response, &block)
    response_parsed = response.body.blank? ? {} : JSON.parse(response.body)
    yield OpenStruct.new(:body => (response_parsed.is_a?(Hash) ? response_parsed.symbolize_keys : response_parsed), :status => response.status)
  end

  def default_schema
    [
      ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
      ["the_geom", "geometry", "geometry", "geometry"], 
      ["created_at", "timestamp with time zone"],
      ["updated_at", "timestamp with time zone"]
    ]
  end
end
