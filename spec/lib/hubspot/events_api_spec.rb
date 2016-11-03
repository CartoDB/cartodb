# encoding utf-8

require 'spec_helper_min'

describe EventsApi do
  before(:all) do
      @api = ::Hubspot::EventsApi.instance
    end

    after(:all) do
      @api = nil
    end

    before(:each) do
      @api.stub(:enabled?).returns(true)
    end

    it 'should handle reporting when hubspot is disabled' do
      @api.stub(:enabled?).returns(false)
      expect { @api.report('foo') }.to_not raise_error
    end
  end
