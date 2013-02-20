# encoding: utf-8
require_relative '../../../../filesystem/s3/backend'

require 'minitest/autorun'

include DataRepository::Filesystem

describe S3::Backend do
  before do
    @data = File.open('/var/tmp/foo.txt')
  end

  describe '#store' do
    it 'stores data to a file in an S3 bucket' do
      url = S3::Backend.new.store(@data, 'foo.txt')

      URI(url).scheme .must_equal 'https'
      URI(url).host   .must_match /aws/
      URI(url).path   .must_match /foo.txt/
    end
  end #store

  describe '#fetch' do
    it 'retrieves data from a file in S3 bucket' do
      url             = S3::Backend.new.store(@data, 'foo.txt')
      retrieved_data  = S3::Backend.new.fetch(url)

      retrieved_data.read.must_equal @data.read
    end
  end #fetch
end # Backend

