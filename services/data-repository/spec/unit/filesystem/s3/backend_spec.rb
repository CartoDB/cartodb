# encoding: utf-8
require 'minitest/autorun'
require 'stringio'
require_relative '../../../../filesystem/s3/backend'

include DataRepository::Filesystem

describe S3::Backend do
  before do
    @data = StringIO.new(Time.now.to_f.to_s)
    @path = '/var/tmp/foo.txt'
  end

  after do
    @data.close
  end

  describe '#store' do
    it 'stores data to a file in an S3 bucket' do
      url = S3::Backend.new.store(@path, @data)

      URI(url).scheme .must_equal 'https'
      URI(url).host   .must_match /aws/
      URI(url).path   .must_match /#{@path}/
    end
  end #store

  describe '#fetch' do
    it 'retrieves data from a file in S3 bucket' do
      url             = S3::Backend.new.store(@path, @data)
      retrieved_data  = S3::Backend.new.fetch(url).read

      @data.rewind
      retrieved_data.must_equal @data.read
    end
  end #fetch

  describe '#presigned_url_for' do
    it 'returns a presigned GET URL from a public URL' do
      s3          = S3::Backend.new
      public_url  = s3.store(@path, @data)

      s3.presigned_url_for(public_url).must_match /Expires.*Signature/
    end
  end

  describe '#delete' do
    it 'deletes a file from an S3 bucket' do
      s3          = S3::Backend.new
      public_url  = s3.store(@path, @data)

      s3.delete(public_url)
      lambda { s3.fetch(public_url).read }
        .must_raise AWS::S3::Errors::AccessDenied
    end
  end
end # Backend

