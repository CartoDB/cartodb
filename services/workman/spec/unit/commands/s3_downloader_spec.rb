# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../commands/s3_downloader'
require_relative '../../../commands/s3_uploader'

include Workman::Commands

describe S3Downloader do
  before do
    AWS.config(
      access_key_id:      nil,
      secret_access_key:  nil
    )
  end

  describe '#initialize' do
    it 'sets the (optionally) passed AWS configuration using the
    AWSConfigurator' do
      AWS.config(access_key_id: 'bogus')
      S3Downloader.new
      AWS.config.access_key_id.must_equal 'bogus'

      AWS.config(access_key_id: nil)
      S3Downloader.new(access_key_id: 'passed_key')
      AWS.config.access_key_id.must_equal 'passed_key'
    end
  end #initialize

  describe '#download' do
    it 'downloads a file from the passed url' do
      fake_filepath     = File.path(fake_file_factory)
      uploaded_file_url = S3Uploader.new.upload(fake_filepath).to_s

      filepath = S3Downloader.new.download(uploaded_file_url, '/var/tmp')
      File.exists?(filepath).must_equal true
    end
  end #download

  def fake_file_factory
    file = File.new("/var/tmp/#{Time.now.utc.to_f}", 'w' )
    file.puts 'bogus'
    file
  end #fake_file_factory
end # S3Downloader
  
