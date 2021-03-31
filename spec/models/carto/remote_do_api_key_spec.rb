require 'spec_helper_unit'

describe Carto::RemoteDoApiKey do
  let(:username) { 'random-user' }
  let(:type) { Carto::ApiKey::TYPE_MASTER }
  let(:token) { '1234-abcd-5678' }
  let(:redis_key) { 'api_keys:random-user:1234-abcd-5678' }
  let(:api_key) { described_class.new(token: token, username: username, type: type) }

  after { clean_redis_databases }

  describe '#initialize' do
    it 'correctly initializes the record' do
      expect(api_key.token).to eq(token)
      expect(api_key.username).to eq(username)
      expect(api_key.type).to eq(type)
      expect(api_key.redis_client).to be_present
    end
  end

  describe '#save!' do
    it 'saves the API key to redis' do
      api_key.save!

      expect($users_metadata.hgetall(redis_key)).to(
        eq('user' => 'random-user', 'type' => 'master')
      )
    end
  end

  describe '#destroy!' do
    before { api_key.save! }

    it 'destroys the API key from redis' do
      api_key.destroy!

      expect($users_metadata.hgetall(redis_key)).to eq({})
    end
  end
end
