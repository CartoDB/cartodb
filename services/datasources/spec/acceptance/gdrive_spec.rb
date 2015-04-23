# encoding: utf-8

require 'yaml'
require_relative '../../lib/datasources'
require_relative '../doubles/user'

include CartoDB::Datasources

describe Url::GDrive do

  def get_config
    @config ||= YAML.load_file("#{File.dirname(__FILE__)}/../../../../config/app_config.yml")['defaults']['oauth']['gdrive']
  end #get_config

  describe '#manual_test' do
    it 'with user interaction, tests the full oauth flow and lists files of an account' do
      user_mock = CartoDB::Datasources::Doubles::User.new

      config = get_config
      gdrive_datasource = Url::GDrive.get_new(config, user_mock)

      if config.include?(:refresh_token)
        gdrive_datasource.token = config[:refresh_token]
      else
        pending('If config unset, this test requires manual running. Check its source code to see what to do')
        puts gdrive_datasource.get_auth_url
        input = ''
        gdrive_datasource.validate_auth_code(input)
        puts gdrive_datasource.token
      end
      data = gdrive_datasource.get_resources_list
      puts data
    end
  end

end

