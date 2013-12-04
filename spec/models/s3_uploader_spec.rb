# encoding: utf-8

require 'spec_helper'

describe S3Uploader do
  describe '#configured?' do
    it 'returns true if valid S3 configuration passed' do
      configuration = {}
      S3Uploader.new(configuration).configured?.should == false

      configuration = {
        importer: {
          's3' => {
            access_key_id:      'bogus',
            secret_access_key:  'bogus',
            bucket_name:        'bogus'
          }
        }
      }

      S3Uploader.new(configuration).configured?.should == true

      configuration = {
        importer: {
          's3' => {
            'access_key_id'       => 'bogus',
            'secret_access_key'   => 'bogus',
            'bucket_name'         => 'bogus'
          }
        }
      }

      S3Uploader.new(configuration).configured?.should == true
    end
  end

  describe '#s3_configuration' do
    it 'returns an empty hash if no valid configuration provided
    at initialization' do
      S3Uploader.new({}).s3_configuration.should be_empty
    end
  end

  describe '#s3' do
    it 'returns an S3 backend object' do
      S3Uploader.new({}).s3.respond_to?(:store).should == true
    end
  end

  describe '#upload' do
    it 'uploads a file to S3' do
      ENV['AWS_ACCESS_KEY_ID'].should_not be_nil
      ENV['AWS_SECRET_ACCESS_KEY'].should_not be_nil
      ENV['S3_BUCKET'].should_not be_nil

      name        = "bogus_#{Time.now.to_f}"
      data        = StringIO::new
      uploader    = S3Uploader.new({})

      public_url  = uploader.upload(name, data)
      public_url.should =~ /amazon/

      uploader.s3.delete(public_url)
    end
  end

  describe '#presigned_url_for' do
    it 'prepares a presigned S3 URL from a public S3 URL' do
      ENV['AWS_ACCESS_KEY_ID'].should_not be_nil
      ENV['AWS_SECRET_ACCESS_KEY'].should_not be_nil
      ENV['S3_BUCKET'].should_not be_nil

      name          = "bogus_#{Time.now.to_f}"
      data          = StringIO::new
      uploader      = S3Uploader.new({})

      public_url    = uploader.upload(name, data)
      presigned_url = uploader.presigned_url_for(public_url)
      presigned_url.should =~ /Expires.*Signature/

      uploader.s3.delete(public_url)
    end
  end

  describe '#valid_s3_configuration?' do
    it 'returns true if the configuration object has required S3 keys' do
      s3_configuration = {
        access_key_id:      'bogus',
        secret_access_key:  'bogus',
        bucket_name:        'bogus'
      }

      S3Uploader.new({}).valid_s3_configuration?(s3_configuration)
        .should == true

      s3_configuration = {
        'access_key_id'       => 'bogus',
        'secret_access_key'   => 'bogus',
        'bucket_name'         => 'bogus'
      }

      S3Uploader.new({}).valid_s3_configuration?(s3_configuration)
        .should == false
    end
  end
end
