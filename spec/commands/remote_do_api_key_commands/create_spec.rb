require 'spec_helper'

describe RemoteDoApiKeyCommands::Create do
  include_context 'with database purgue'

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
