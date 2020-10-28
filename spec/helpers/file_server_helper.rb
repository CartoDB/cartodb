module FileServerHelper
  def serve_file(file_path, options = {})
    port = get_unused_port

    require 'webrick'
    server = WEBrick::HTTPServer.new(
      AccessLog: [],
      Logger: WEBrick::Log::new("/dev/null", 7), # comment this line if weird things happen
      Port: port,
      DocumentRoot: File.dirname(file_path),
      RequestCallback: Proc.new do |_req, res|
        options[:headers].each { |k, v| res[k] = v } unless options[:headers].nil?
        unless options[:headers].nil? || options[:headers]['content-type'].nil?
          res.content_type = options[:headers]['content-type']
        end
      end
    )

    trap("INT") { server.shutdown }

    a = Thread.new { server.start }

    begin
      yield "http://localhost:#{port}/#{File.basename(file_path)}" if block_given?
    ensure
      b = Thread.new { server.shutdown }

      b.join
      a.join
    end
  end

  def get_unused_port
    used_ports_command = `netstat -tln | tail -n +3 | awk '{ print $4 }' | cut -f2 -d ':'`
    used_ports = used_ports_command.split("\n").map(&:to_i)

    (rand(10000..10100)..65535).each do |port|
      return port if !used_ports.include?(port)
    end

    raise "No ports available on machine."
  end

  def stub_download(url:, filepath:, headers: {}, content_disposition: true)
    Typhoeus.stub(url).and_return(response_for(filepath, headers, content_disposition: content_disposition))
  end

  def stub_failed_download(options)
    url       = options.fetch(:url)
    filepath  = options.fetch(:filepath)
    headers   = options.fetch(:headers, {})

    Typhoeus.stub(url).and_return(failed_response_for(filepath, headers))
  end

  def response_for(filepath, headers = {}, content_disposition: true)
    response = Typhoeus::Response.new(
      code:     200,
      body:     File.new(filepath).read.to_s,
      headers:  headers.merge(headers_for(filepath, content_disposition: content_disposition))
    )
    response
  end

  def failed_response_for(_filepath, headers={})
    Typhoeus::Response.new(code: 404, body: nil, headers: {})
  end

  def headers_for(filepath, content_disposition: true)
    return {} unless content_disposition
    filename = filepath.split('/').last
    { "Content-Disposition" => "attachment; filename=#{filename}" }
  end

  def stub_arcgis_response_with_file(
    absolute_filepath,
    absolute_metadata_filepath = File.expand_path('spec/fixtures/arcgis_metadata.json')
  )
    # Metadata of a layer
    Typhoeus.stub(/\/arcgis\/rest\/services\/Planning\/EPI_Primary_Planning_Layers\/MapServer\/2\?f=json/) do
      body = File.read(absolute_metadata_filepath)
      Typhoeus::Response.new(
        code: 200,
        headers: { 'Content-Type' => 'application/json' },
        body: body
      )
    end

    # IDs list of a layer
    Typhoeus.stub(/\/arcgis\/rest\/(.*)query\?where=/) do
      json_file = JSON.parse(File.read(absolute_filepath))
      Typhoeus::Response.new(
        code: 200,
        headers: { 'Content-Type' => 'application/json' },
        body: JSON.dump(
          objectIdFieldName: "OBJECTID",
          objectIds: json_file['features'].map { |f| f['attributes']['OBJECTID'] }
        )
      )
    end

    Typhoeus.stub(/\/arcgis\/rest\/(.*)query$/) do |request|
      response_body = File.read(absolute_filepath)
      response_body = ::JSON.parse(response_body)

      request_body = request.options[:body]

      requested_object_id = nil
      lower_match = nil
      upper_match = nil
      if request_body[:objectIds]
        requested_object_id = request_body[:objectIds]
      else
        lower_match = /OBJECTID\s+>=(\d+)/ =~ request.options[:body][:where]
        upper_match = /OBJECTID\s+<=(\d+)/ =~ request.options[:body][:where]
      end

      response_body['features'] = response_body['features'].select do |f|
        object_id = f['attributes']['OBJECTID']
        if requested_object_id
          object_id == requested_object_id
        elsif lower_match && upper_match
          object_id >= lower_match[1].to_i && object_id <= upper_match[1].to_i
        elsif lower_match
          object_id >= lower_match[1].to_i
        elsif upper_match
          object_id <= upper_match[1].to_i
        end
      end

      Typhoeus::Response.new(
        code: 200,
        headers: { 'Content-Type' => 'application/json' },
        body: ::JSON.dump(response_body)
      )
    end
  end
end
