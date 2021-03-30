require 'spec_helper_unit'

describe GcloudUserSettingsCommands::Set do
  let(:command) { described_class.new(params) }
  let(:sample_attributes) do
    {
      service_account: 'service_account_joe',
      bq_public_project: 'bq_public_project_joe',
      gcp_execution_project: 'gcp_execution_project_joe',
      bq_project: 'bq_project_joe',
      bq_dataset: 'bq_dataset_joe',
      gcs_bucket: 'gcs_bucket_joe'
    }.with_indifferent_access
  end

  describe '#run' do
    before { command.run }

    after { $users_metadata.del('do_settings:joe') }

    context 'when receiving some settings and not having anything in redis' do
      let(:params) do
        {
          username: 'joe',
          gcloud_settings: sample_attributes
        }
      end

      it 'updates the settings in redis' do
        expect($users_metadata.hgetall('do_settings:joe')).to eq sample_attributes
      end
    end

    context 'when settings are nil but having some prior in redis' do
      before do
        settings.update(sample_attributes)
        command.run
      end

      after { $users_metadata.del('do_settings:joe') }

      let(:settings) { Carto::GCloudUserSettings.new('joe') }
      let(:params) do
        {
          username: 'joe',
          gcloud_settings: nil
        }
      end

      it 'updates the settings in redis' do
        expect($users_metadata.hgetall('do_settings:joe')).to be_empty
      end
    end
  end
end
