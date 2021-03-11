require 'active_support'
require 'active_support/core_ext/object/blank'
require 'active_support/core_ext/hash/keys'
require 'active_support/core_ext/hash/indifferent_access'
require_relative '../../../lib/carto/gcloud_user_settings'
require 'mock_redis'

describe Carto::GCloudUserSettings do
  let(:redis) { MockRedis.new }
  let(:settings) { described_class.new('pepito', redis) }
  let(:sample_attributes) do
    {
      service_account: 'service_account_pepito',
      bq_public_project: 'bq_public_project_pepito',
      gcp_execution_project: 'gcp_execution_project_pepito',
      bq_project: 'bq_project_pepito',
      bq_dataset: 'bq_dataset_pepito',
      gcs_bucket: 'gcs_bucket_pepito'
    }.with_indifferent_access
  end

  describe '#initialize' do
    it 'takes a username as input' do
      expect { described_class.new('juanito') }.not_to raise_error
    end

    it 'lets you inject a redis instance' do
      expect { described_class.new('juanito', redis) }.not_to raise_error
    end
  end

  context 'with empty redis entries' do
    describe '#update' do
      it 'stores in redis the attributes passed' do
        settings.update(sample_attributes)
        expect(redis.hgetall('do_settings:pepito')).to eq sample_attributes
      end

      it 'ignores attributes that are not part of REDIS_KEYS' do
        settings.update(
          service_account: 'service_account_pepito',
          foo: 'bar'
        )
        expected_values = { 'service_account' => 'service_account_pepito' }
        expect(redis.hgetall('do_settings:pepito')).to eq expected_values
      end
    end

    describe '#read' do
      it 'returns empty values from redis' do
        expect(settings.read).to eq sample_attributes.symbolize_keys.map { |k, _| [k, nil] }.to_h
      end
    end
  end

  context 'with some pre-existing redis entries' do
    before { settings.update(sample_attributes) }

    describe '#update' do
      it 'removes the redis hash when attributes are nil' do
        settings.update(nil)
        expect(redis.exists('do_settings:pepito')).to eq 0
      end

      it 'removes the redis hash when attributes are emtpy' do
        settings.update({})
        expect(redis.exists('do_settings:pepito')).to eq 0
      end
    end

    describe '#read' do
      it 'returns the expected values from redis' do
        expect(settings.read).to eq sample_attributes.symbolize_keys
      end
    end
  end
end
