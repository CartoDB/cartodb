require 'spec_helper'

describe "Varnish" do
  before(:each) do
    @telnet_mock = mock('Net::Telnet')
    Net::Telnet.stubs(:new).returns(@telnet_mock)
    @telnet_mock.stubs(:close)
    @telnet_mock.stubs(:cmd)
    @telnet_mock.stubs(:puts)
    @telnet_mock.stubs(:waitfor)
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
        @telnet_mock.expects(:close).times(1)
        CartoDB::Varnish.new.purge('/')
      end
    end

  end

  describe "when sending a purge command" do 
    it "should return successfully" do
      @telnet_mock.stubs(:cmd).with("String" => "purge wadus", "Match" => /\n\n/).yields('200')
      CartoDB::Varnish.new.purge('wadus').should == "200"
    end
  end

  describe "when sending a purge_url command" do 
    it "should return successfully" do
      @telnet_mock.stubs(:cmd).with("String" => "url.purge /", "Match" => /\n\n/).yields('200')
      CartoDB::Varnish.new.purge_url('/').should == "200"
    end
  end
end
