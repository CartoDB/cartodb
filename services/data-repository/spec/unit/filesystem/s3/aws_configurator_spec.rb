# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../../filesystem/s3/aws_configurator'

include DataRepository::Filesystem::S3

describe AWSConfigurator do
  describe '#configure' do
    it 'gives first preference to existing AWS.config settings' do
      AWS.config(
        access_key_id:      'existing_access_key_id',
        secret_access_key:  'existing_secret_access_key'
      )

      config = {
        access_key_id:      'passed_access_key_id',
        secret_access_key:  'passed_secret_access_key'
      }

      AWSConfigurator.new(config).configure
      AWS.config.access_key_id.must_match /existing_access/
      AWS.config.secret_access_key.must_match /existing_secret/
    end

    it 'gives second preference to passed configuration' do
      AWS.config(
        access_key_id:      nil,
        secret_access_key:  nil
      )

      config = {
        access_key_id:      'passed_access_key_id',
        secret_access_key:  'passed_secret_access_key'
      }

      AWSConfigurator.new(config).configure
      AWS.config.access_key_id.must_match /passed_access/
      AWS.config.secret_access_key.must_match /passed_secret/
    end

    it 'gives last preference to environment variables' do
      AWS.config(
        access_key_id:      nil,
        secret_access_key:  nil 
      )

      previous_access_key_id        = ENV['AWS_ACCESS_KEY_ID']  
      previous_secret_access_key    = ENV['AWS_SECRET_ACCESS_KEY'] 
      ENV['AWS_ACCESS_KEY_ID']      = 'environment_access_key_id'
      ENV['AWS_SECRET_ACCESS_KEY']  = 'environment_secret_access_key'

      AWSConfigurator.new.configure
      AWS.config.access_key_id.must_match /environment_access/
      AWS.config.secret_access_key.must_match /environment_secret/

      ENV['AWS_ACCESS_KEY_ID']      = previous_access_key_id        
      ENV['AWS_SECRET_ACCESS_KEY']  = previous_secret_access_key  
    end
  end #configure
end # AWSConfigurator

