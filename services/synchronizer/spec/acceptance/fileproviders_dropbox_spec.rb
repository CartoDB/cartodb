# encoding: utf-8

require_relative '../../lib/synchronizer/file-providers/dropbox'
require 'yaml'

describe Dropbox do

  def get_config
    @config ||= YAML.load_file("#{File.dirname(__FILE__)}/../../../../config/app_config.yml")['defaults']['dropbox_oauth']
    config_hash = {
      app_key: @config['app_key'],
      app_secret: @config['app_secret']
    }
    config_hash
  end #get_config

  describe '#manual_test' do
    it 'with user interaction, tests the full oauth flow and lists files of an account' do
      config = get_config
      dropbox_provider = CartoDB::Synchronizer::FileProviders::Dropbox.get_new(config)

      if config.include?(:access_token)
        dropbox_provider.token = config[:access_token]
      else
        pending('This test requires manual run, opening the url in a browser, grabbing the code and setting "input" to it')
        puts dropbox_provider.get_auth_url
        input = ''
        debugger
        dropbox_provider.validate_auth_code(input)
        puts dropbox_provider.token
      end
      data = dropbox_provider.get_files_list
      puts data
    end
  end

end

