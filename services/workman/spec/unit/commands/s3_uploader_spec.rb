# encoding: utf-8
require 'minitest/autorun'
require 'ostruct'
require_relative '../../../commands/s3_uploader'

include Workman::Commands

describe S3Uploader do
  describe '#initialize' do
    it 'sets the (optionally) passed AWS configuration using the
    AWSConfigurator' do
      AWS.config(access_key_id: 'bogus')
      S3Uploader.new
      AWS.config.access_key_id.must_equal 'bogus'

      AWS.config(access_key_id: nil)
      S3Uploader.new(access_key_id: 'passed_key')
      AWS.config.access_key_id.must_equal 'passed_key'
    end
  end #initialize

  describe '#upload' do
    before do
      AWS.config(
        access_key_id:      nil,
        secret_access_key:  nil
      )

      @fake_file                    = fake_file_factory
      @fake_bucket                  = fake_bucket_factory
    end

    it 'strips the path from the uploaded file name' do
      S3Uploader.new.upload(@fake_file.path, @fake_bucket).wont_match /var/
    end

    it 'returns the url of the uploaded file' do
      url = S3Uploader.new.upload(@fake_file.path, @fake_bucket)
      url.must_match /http/
      url.must_match File.basename(@fake_file)
    end
  end #upload

  def fake_bucket_factory
    bucket = OpenStruct.new(fake_file: fake_uploaded_file)
    def bucket.objects; Hash.new(self.fake_file); end
    bucket
  end #fake_bucket_factory

  def fake_uploaded_file
    Class.new do
      def write(arguments={})
        @filepath = arguments.fetch(:file)
      end

      def public_url; 
        "http://s3.amazonaws.com/bucket/#{File.basename(@filepath)}"
      end #public_url
    end.new
  end #fake_uploaded_file

  def fake_file_factory
    file = File.new("/var/tmp/#{Time.now.utc.to_f}", 'w' )
    file.puts 'bogus'
    file
  end #fake_file_factory
end # S3Uploader

