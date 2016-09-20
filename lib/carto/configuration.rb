module Carto::Configuration
  def db_config
    YAML.load(File.read(db_config_file))
  end

  private

  def config_files_root
    if ENV['RAILS_CONFIG_BASE_PATH']
      Pathname.new(ENV['RAILS_CONFIG_BASE_PATH'])
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
end

# TODO: singleton
class Carto::Conf
  include Carto::Configuration
end
