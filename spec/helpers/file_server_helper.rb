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
    rescue => e
      raise e
    ensure
      b = Thread.new { server.shutdown }

      b.join
      a.join
    end
  end

  def get_unused_port
    used_ports_command = `netstat -tln | tail -n +3 | awk '{ print $4 }' | cut -f2 -d ':'`
    used_ports = used_ports_command.split("\n").map(&:to_i)

    (10000..65535).each do |port|
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
end
