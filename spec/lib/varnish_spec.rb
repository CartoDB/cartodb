require_relative '../spec_helper'

describe "Varnish" do
  before(:all) do
    @first_config = Cartodb::config[:varnish_management]
  end

  before(:each) do
    @telnet_mock = double('Net::Telnet')
    allow(Net::Telnet).to receive(:new).and_return(@telnet_mock)
    allow(@telnet_mock).to receive(:close)
    #@telnet_mock.stubs(:cmd).with("String" => "purge wadus", "Match" => /\n\n/).yields('200')
    allow(@telnet_mock).to receive(:puts)
    allow(@telnet_mock).to receive(:waitfor)

  end

  describe "with HTTP requests" do
    before(:all) do
      allow(Cartodb::config).to receive(:[]).and_return(@first_config.merge({'host' => 'wadus', 'http_port' => 6081}))
    end

    it "goes over HTTP when http_port is specified" do
      @mock_request = double('Typhoeus::Request')
      allow(@mock_request).to receive(:code).and_return(200)
      allow_any_instance_of(Typhoeus::Request).to receive(:run).and_return(@mock_request)
      CartoDB::Varnish.new.purge('/')
    end
  end
  describe "with Telnet requests" do
    before(:each) do
      allow(Cartodb::config).to receive(:[]).and_return(@first_config)
    end

    describe "with any command" do
      describe "when connection is unsuccessful" do
        it "should raise an error on timeout" do
          allow(@telnet_mock).to receive(:cmd).and_raise(Timeout::Error)
          lambda {
            CartoDB::Varnish.new.purge('/')
          }.should raise_error(RuntimeError)
        end

        it "should retry on failure before erroring" do
          allow(@telnet_mock).to receive(:cmd).and_raise(Timeout::Error)
          expect(Net::Telnet).to receive(:new).times(5)
          lambda {
            CartoDB::Varnish.new.purge('/')
          }.should raise_error(RuntimeError)
        end

        it "should close the connection afterwards" do
          allow(@telnet_mock).to receive(:cmd).with("String" => "purge obj.http.X-Cache-Channel ~ /", "Match" => /\n\n/).yields('200')
          expect(@telnet_mock).to receive(:close).times(1)
          CartoDB::Varnish.new.purge('/')
        end
      end

    end

    describe "when sending a purge command" do 
      it "should return successfully" do
        @cdb_config = double('Cartodb::config')
        allow(@cdb_config).to receive('[]').and_return({'host' => 'wadus'})
        allow(@telnet_mock).to receive(:cmd).with("String" => "purge obj.http.X-Cache-Channel ~ wadus", "Match" => /\n\n/).yields('200')
        CartoDB::Varnish.new.purge('wadus').should == "200"
      end
    end
  end
end
