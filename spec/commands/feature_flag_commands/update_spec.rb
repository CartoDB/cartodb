require 'spec_helper_unit'

describe FeatureFlagCommands::Update do
  let(:feature_flag) { create(:feature_flag, restricted: false) }
  let(:updated_feature_flag) { feature_flag.reload }
  let(:command) { described_class.new(params) }
  let(:params) { { feature_flag: feature_flag_params } }
  let(:feature_flag_params) { { id: id_param, restricted: restricted_param, name: name_param } }
  let(:id_param) { feature_flag.id }
  let(:restricted_param) { true }
  let(:name_param) { 'new-name' }

  describe '#run' do
    context 'when everything is ok' do
      before { command.run }

      it 'updates the corresponding attributes' do
        expect(updated_feature_flag.name).to eq(name_param)
        expect(updated_feature_flag.restricted).to eq(restricted_param)
      end
    end

    context 'when error occurs' do
      let(:id_param) { 'not-found' }

      it 'raises an error and does not update attributes' do
        expect { command.run }.to raise_error(ActiveRecord::RecordNotFound)
        expect(updated_feature_flag.name).not_to eq(name_param)
        expect(updated_feature_flag.restricted).not_to eq(restricted_param)
      end
    end
  end
end
