require 'spec_helper_unit'

describe RemoteDoApiKeyCommands::Create do
  let(:command) { described_class.new(params) }
  let(:params) do
    {
      token: '1234-abcd-5678',
      username: 'perico',
      type: Carto::ApiKey::TYPE_MASTER
    }
  end

  describe '#run' do
    it 'runs OK' do
      command.run
    end
  end
end
