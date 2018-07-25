require 'spec_helper'
require 'carto_gears_api/queue/generic_job'
require 'carto_gears_api/test_mail'

describe CartoGearsApi::Queue::GenericJob do
  describe '#perform' do
    it 'instantiates the class, and invokes the method with random parameters' do
      from = 'support@carto.com'
      to = 'backend@carto.com'
      subject = 'test email'
      CartoGearsApi::Mailers::TestMail.should_receive(:test_mail).with(from, to, subject)
      CartoGearsApi::Queue::GenericJob.perform('CartoGearsApi::Mailers::TestMail', :test_mail, from, to, subject)
    end
  end
end
