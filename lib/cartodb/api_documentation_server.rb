module CartoDB
  class ApiDocumentationServer
    
    def initialize(app)
      @app = app
    end
    
    def call(env)
      if env['HTTP_HOST'] =~ /^developers\./
        # Servimos el path que nos pidan
        layout_path = "#{Rails.root}/app/views/layouts/api_doc.html.erb"
        file_path = "#{Rails.root}/app/views/api_doc/#{env['PATH_INFO']}"
        if file_path =~ /\/$/
          file_path = file_path + 'index.html'
        else
          file_path = file_path + '.html'
        end
        unless File.file?(layout_path) and File.file?(file_path)
          [ 404, {}, "" ]
        else
          [ 200, { 'Content-Type' => 'text/html'}, File.read(layout_path).gsub(/\{\{yield\}\}/,File.open(file_path).read) ]
        end
      else
        @app.call(env)
      end
    end
  end
end
