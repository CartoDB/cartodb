require 'erb'

module CartoDB
  class ApiDocumentationServer

    def initialize(app)
      @app = app
    end

    def call(env)
      if env['HTTP_HOST'] =~ /^developers\./ && authenticated?(env)
        begin
          layout_path = "#{Rails.root}/app/views/layouts/developers.html.erb"
          file_path = "#{Rails.root}/app/views/developers/#{env['PATH_INFO']}"
          file_path =~ /\/$/ ? file_path += 'index.html' : file_path += '.html'

          html = File.read(layout_path).gsub(/\{\{yield\}\}/,File.open(file_path).read).
                                        gsub(/\{\{sidebar\}\}/,File.open("#{Rails.root}/app/views/developers/api/_sidebar.html").read)
          unless File.file?(layout_path) and File.file?(file_path)
            [ 404, {'Content-Type' => 'text/html'}, File.read("#{Rails.root}/public/404.html.erb") ]
          else
            [ 200, {'Content-Type' => 'text/html'}, ERB.new(html).result(binding) ]
          end
        rescue
          [ 404, {'Content-Type' => 'text/html'}, File.read("#{Rails.root}/public/404.html.erb") ]
        end
      else
        @app.call(env)
      end
    end

    def authenticated?(env)
      env['warden'].user
    end
    private :authenticated?
  end
end
