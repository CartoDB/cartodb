# encoding: utf-8
require 'minitest/autorun'
require 'json'
require 'redis'
require_relative '../../../redis/api_credential_metadata'

include CartoDB::Relocator

describe APICredentialMetadata do
  before do
    @old_user_id              = 2
    @new_user_id              = rand(100) + 100
    json_metadata             = File.open(File.join(File.dirname(__FILE__), '..',
                                  '..', 'fixtures', 'api_credentials_metadata.json'))
                                  .readlines.join
    @sample                   = JSON.parse(json_metadata)
    @redis                    = Redis.new(db: 8)
    @api_credential_metadata  = APICredentialMetadata.new(@new_user_id, @redis)
    @redis.flushdb  
  end

  describe '#transform' do
    it 'changes the user_id in the data' do
      @sample.values.first.fetch('user_id').must_match(/#{@old_user_id}/)

      metadata = @api_credential_metadata.transform(@sample).values.first

      metadata.fetch('user_id').to_s.wont_match(/#{@old_user_id}/)
      metadata.fetch('user_id').to_s.must_match(/#{@new_user_id}/)
    end
  end #transform

  describe '#load' do
    it 'loads the metadata into redis' do
      @redis.keys(@sample.keys.first).must_be_empty
      @api_credential_metadata.load(@sample)
      @redis.keys(@sample.keys.first).wont_be_empty
    end
  end #load
end # Relocator::Redis::Loader

