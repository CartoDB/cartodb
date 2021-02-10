require 'yaml'
require 'spec_helper_min'
require_relative '../../lib/datasources'
require_relative '../doubles/user'

include CartoDB::Datasources

describe Url::Dropbox do

  def get_config
    @config ||= YAML.load_file("#{File.dirname(__FILE__)}/../../../../config/app_config.yml")['defaults']['oauth']['dropbox']
  end #get_config

  describe '#manual_test' do
    it 'with user interaction, tests the full oauth flow and lists files of an account' do
      user_mock = CartoDB::Datasources::Doubles::User.new

      config = get_config
      dropbox_datasource = Url::Dropbox.get_new(config, user_mock)

      if config.include?(:access_token)
        dropbox_datasource.token = config[:access_token]
      else
        pending('This test requires manual run, opening the url in a browser, grabbing the code and setting "input" to it')
        puts dropbox_datasource.get_auth_url
        input = ''
        dropbox_datasource.validate_auth_code(input)
        puts dropbox_datasource.token
      end
      data = dropbox_datasource.get_resources_list
      puts data
    end
  end

end
