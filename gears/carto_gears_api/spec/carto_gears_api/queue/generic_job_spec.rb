require 'spec_helper'
require 'carto_gears_api/queue/generic_job'
require 'carto_gears_api/test_mail'

describe CartoGearsApi::Queue::GenericJob do
  describe '#perform' do
    it 'instantiates the class, and invokes the method with random parameters' do
      CartoGearsApi::TestMail.any_instance.should_receive(:test_mail).with('param1', 2)
      CartoGearsApi::Queue::GenericJob.new.perform(CartoGearsApi::Mailer::TestMail,
                                                   :test_mail,
                                                   'support@carto.com',
                                                   'support@carto.com',
                                                   'Test email')
    end
  end
end
