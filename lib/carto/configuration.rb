module Carto::Configuration
  def db_config
    @@db_config ||= YAML.load(File.read(db_config_file))
  end

  def app_config
    @@app_config = YAML.load_file(app_config_file)
  end

  def log_file_path(filename)
    "#{log_dir_path}/#{filename}"
  end

  def log_dir_path
    "#{log_files_root}/log"
  end

  def uploaded_file_path(path)
    pathname = Pathname.new(path)
    return path if pathname.absolute? && pathname.exist?

    upload_path = Cartodb.get_config(:importer, 'uploads_path')
    if upload_path
      # Ugly patch workarounding some hardcoded /uploads
      "#{upload_path}#{path}".gsub('/uploads/uploads/', '/uploads/')
    else
      Rails.root.join("public#{path}").to_s
    end
  end

  private

  def config_files_root
    if ENV['RAILS_CONFIG_BASE_PATH']
      Pathname.new(ENV['RAILS_CONFIG_BASE_PATH'])
    else
      Rails.root
    end
  end

  def log_files_root
    if ENV['RAILS_LOG_BASE_PATH']
      Pathname.new(ENV['RAILS_LOG_BASE_PATH'])
    else
      Rails.root
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

class Carto::Conf
  include Carto::Configuration
end
