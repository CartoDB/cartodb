require 'spec_helper'

describe RemoteDoApiKeyCommands::Destroy do
  let(:command) { described_class.new(token: '1234-abcd-5678', username: 'perico') }

  describe '#run' do
    it 'runs OK' do
      command.run
    end
  end
end
