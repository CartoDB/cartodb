require 'spec_helper_unit'

describe FeatureFlagCommands::Delete do
  let(:feature_flag) { create(:feature_flag) }
  let(:command) { described_class.new(params) }
  let(:params) { { feature_flag: { id: id_param } } }
  let(:id_param) { feature_flag.id }

  describe '#run' do
    context 'when everything is ok' do
      let(:user) { create(:user) }

      it 'deletes the feature flag' do
        command.run

        expect { feature_flag.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it 'unlinks the feature flag from users' do
        user.activate_feature_flag!(feature_flag)

        expect do
          command.run
        end.to change(Carto::FeatureFlagsUser, :count).by(-1)
      end
    end

    context 'when error occurs' do
      let(:id_param) { 'not-found' }

      it 'raises an error' do
        expect { command.run }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
