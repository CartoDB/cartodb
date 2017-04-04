require 'spec_helper'
require 'carto_gears_api/queue/jobs_service'
require 'carto_gears_api/queue/generic_job'
require 'carto_gears_api/test_mail'

describe CartoGearsApi::Queue::JobsService do
  let(:service) { CartoGearsApi::Queue::JobsService.new }

  module Resque; end

  describe '#send_job' do
    it 'enqueues a Resque::CartoGearsJobs::GenericJob#perform with the class, method and random parameters' do
      ::Resque.should_receive(:enqueue).with(CartoGearsApi::Queue::GenericJob,
                                             'CartoGearsApi::Mailers::TestMail',
                                             :test_mail,
                                             'param1',
                                             2)
      service.send_job('CartoGearsApi::Mailers::TestMail', :test_mail, 'param1', 2)
    end
  end
end
