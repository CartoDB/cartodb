require_relative '../spec_helper'

describe "Varnish" do
  before(:all) do
    @first_config = Cartodb::config[:varnish_management]
  end

  before(:each) do
    @telnet_mock = mock('Net::Telnet')
    Net::Telnet.stubs(:new).returns(@telnet_mock)
    @telnet_mock.stubs(:close)
    #@telnet_mock.stubs(:cmd).with("String" => "purge wadus", "Match" => /\n\n/).yields('200')
    @telnet_mock.stubs(:puts)
    @telnet_mock.stubs(:waitfor)

  end

  describe "with HTTP requests" do
    before(:all) do
      Cartodb::config.stubs(:[]).returns(@first_config.merge({'host' => 'wadus', 'http_port' => 6081}))
    end

    it "goes over HTTP when http_port is specified" do
      @mock_request = mock('Typhoeus::Request')
      @mock_request.stubs(:code).returns(200)
      Typhoeus::Request.any_instance.stubs(:run).returns(@mock_request)
      CartoDB::Varnish.new.purge('/')
    end
  end
  describe "with Telnet requests" do
    before(:each) do
      Cartodb::config.stubs(:[]).returns(@first_config)
    end

    describe "with any command" do
      describe "when connection is unsuccessful" do
        it "should raise an error on timeout" do
          @telnet_mock.stubs(:cmd).raises(Timeout::Error)
          lambda {
            CartoDB::Varnish.new.purge('/')
          }.should raise_error(RuntimeError)
        end

        it "should retry on failure before erroring" do
          @telnet_mock.stubs(:cmd).raises(Timeout::Error)
          Net::Telnet.expects(:new).times(5)
          lambda {
            CartoDB::Varnish.new.purge('/')
          }.should raise_error(RuntimeError)
        end

        it "should close the connection afterwards" do
          @telnet_mock.stubs(:cmd).with("String" => "purge obj.http.X-Cache-Channel ~ /", "Match" => /\n\n/).yields('200')
          @telnet_mock.expects(:close).times(1)
          CartoDB::Varnish.new.purge('/')
        end
      end

    end

    describe "when sending a purge command" do 
      it "should return successfully" do
        @cdb_config = mock('Cartodb::config')
        @cdb_config.stubs('[]').returns({'host' => 'wadus'})
        @telnet_mock.stubs(:cmd).with("String" => "purge obj.http.X-Cache-Channel ~ wadus", "Match" => /\n\n/).yields('200')
        CartoDB::Varnish.new.purge('wadus').should == "200"
      end
    end
  end
end
