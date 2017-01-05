module Carto
  module Configuration
    def db_config
      @@db_config ||= YAML.load(File.read(db_config_file)).freeze
    end

    def app_config
      @@app_config ||= YAML.load_file(app_config_file).freeze
    end

    def env_app_config
      app_config[ENV['RAILS_ENV'] || 'development']
    end

    def log_file_path(filename)
      "#{log_dir_path}/#{filename}"
    end

    def log_dir_path
      "#{log_files_root}/log"
    end

    def public_uploaded_assets_path
      public_uploads_path('uploads')
    end

    def public_uploads_path(subfolder = '')
      path_with_alternative('RAILS_PUBLIC_UPLOADS_PATH', subfolder) do
        if env_app_config && env_app_config[:importer] && env_app_config[:importer]["uploads_path"]
          env_app_config[:importer]["uploads_path"]
        else
          Rails.root.join('public', subfolder).to_s
        end
      end
    end

    def uploaded_file_path(path)
      pathname = Pathname.new(path)
      return path if pathname.exist? && pathname.absolute?

      upload_path = Cartodb.get_config(:importer, 'uploads_path')
      if upload_path
        # Ugly patch needed for backwards compatibility
        "#{upload_path}#{path}".gsub('/uploads/uploads/', '/uploads/')
      else
        Rails.root.join("public#{path}").to_s
      end
    end

    def custom_app_views_paths
      Cartodb.get_config(:custom_paths, 'views')
    end

    private

    def config_files_root
      rails_path('RAILS_CONFIG_BASE_PATH')
    end

    def log_files_root
      rails_path('RAILS_LOG_BASE_PATH')
    end

    def rails_path(environment_variable)
      path_with_alternative(environment_variable) { Rails.root }
    end

    # Returns an string, block should as well
    def path_with_alternative(environment_variable, subfolder_at_environment = '')
      if ENV[environment_variable]
        Pathname.new(ENV[environment_variable]).join(subfolder_at_environment).to_s
      else
        alternative = yield
        alternative || ''
      end
    end

    def db_config_file
      if ENV['RAILS_DATABASE_FILE']
        File.join(config_files_root, 'config/' + ENV['RAILS_DATABASE_FILE'])
      else
        File.join(config_files_root, 'config/database.yml')
      end
    end

    def app_config_file
      "#{config_files_root}/config/app_config.yml"
    end
  end

  class Conf
    include Carto::Configuration
  end
end
