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
      retrieved_data  = S3::Backend.new.fetch(url)

      retrieved_data.read.must_equal @data.read
    end
  end #fetch
end # Backend

