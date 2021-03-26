require 'spec_helper_unit'

describe FeatureFlagCommands::Create do
  let(:command) { described_class.new(params) }
  let(:params) { { feature_flag: feature_flag_params } }
  let(:feature_flag_params) { { id: id_param, restricted: true, name: name_param } }
  let(:id_param) { (Carto::FeatureFlag.count * 10) + 1 }
  let(:name_param) { 'new-name' }
  let(:created_feature_flag) { Carto::FeatureFlag.find(id_param) }

  describe '#run' do
    context 'when everything is ok' do
      before { command.run }

      it 'creates the feature flag' do
        expect(created_feature_flag).to be_present

        expect(created_feature_flag.id).to eq(id_param)
        expect(created_feature_flag.name).to eq(name_param)
        expect(created_feature_flag.restricted).to eq(true)
      end
    end

    context 'when error occurs' do
      let(:name_param) { nil }

      it 'raises an error and does not create any record' do
        expect { command.run }.to raise_error(ActiveRecord::RecordInvalid)
        expect { created_feature_flag }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
