# encoding: utf-8
require_relative '../../services/data-repository/filesystem/s3'

class S3Uploader
  S3_CONFIGURATION_KEYS = [:access_key_id, :secret_access_key, :bucket_name ] 
  DEFAULT_EXPIRATION    = 7200

  def initialize(configuration)
    @configuration = configuration
  end

  def configured?
    valid_s3_configuration?(s3_configuration)
  end

  def s3_configuration
    return @s3_configuration if defined?(@s3_configuration)

    return {} if configuration[:importer].nil? || 
                configuration[:importer].empty?
    return {} if configuration[:importer]['s3'].nil? || 
                configuration[:importer]['s3'].empty?

    @s3_configuration = configuration[:importer]['s3'].symbolize_keys
  end

  def s3
    @s3 ||= DataRepository::Filesystem::S3::Backend.new(s3_configuration)
  end

  def upload(path, data)
    s3.store(path, data)
  end

  def presigned_url_for(url)
    expiration_in_seconds = s3_configuration.fetch(:url_ttl, DEFAULT_EXPIRATION)
    s3.presigned_url_for(url, expiration_in_seconds)
  end

  def valid_s3_configuration?(configuration)
    S3_CONFIGURATION_KEYS.inject(true) { |memo, key|
      memo && (!configuration[key].nil? && !configuration[key].empty?)
    }
  end

  private

  attr_reader :configuration
end # S3Uploader

