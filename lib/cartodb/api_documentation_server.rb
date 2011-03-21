require 'erb'

module CartoDB
  class ApiDocumentationServer
    
    def initialize(app)
      @app = app
    end
    
    def call(env)
      if env['HTTP_HOST'] =~ /^developers\./
        layout_path = "#{Rails.root}/app/views/layouts/api_doc.html.erb"
        file_path = "#{Rails.root}/app/views/api_doc/#{env['PATH_INFO']}"
        file_path =~ /\/$/ ? file_path += 'index.html' : file_path += '.html'
        unless File.file?(layout_path) and File.file?(file_path)
          [ 404, {'Content-Type' => 'text/html'}, File.read("#{Rails.root}/public/404.html") ]
        else
          [ 200, {'Content-Type' => 'text/html'}, ERB.new(File.read(layout_path).gsub(/\{\{yield\}\}/,File.open(file_path).read)).result(binding) ]
        end
      else
        @app.call(env)
      end
    end
  end
end
