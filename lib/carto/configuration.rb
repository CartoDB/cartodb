module Carto::Configuration
  def db_config_file
    if ENV['RAILS_DATABASE_FILE']
      db_config = YAML.load(File.read(File.join(config_files_root, 'config/' + ENV['RAILS_DATABASE_FILE'])))
    else
      db_config = YAML.load(File.read(File.join(config_files_root, 'config/database.yml')))
    end
  end

  private

  def config_files_root
    Rails.root
  end
end

# TODO: singleton
class Carto::Conf
  include Carto::Configuration
end
