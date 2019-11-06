require 'minitest/autorun'
require 'redis'
require_relative '../../spec_helper'
require_relative '../../../backend/detector'

include DataRepository

describe Backend::Detector do
  describe '#detect' do
    it 'returns a memory backend if no connection or backend passed' do
      Backend::Detector.new.detect.must_be_instance_of Backend::Memory
    end

    it "returns the passed object if it's a backend" do
      memory_backend  = Backend::Memory.new
      detector        = Backend::Detector.new(memory_backend)
      detector.detect.must_be_instance_of Backend::Memory

      redis_backend   = Backend::Redis.new
      detector        = Backend::Detector.new(redis_backend)
      detector.detect.must_be_instance_of Backend::Redis
    end

    it 'returns a redis backend if a redis connection is passed' do
      detector = Backend::Detector.new(Redis.new)
      detector.detect.must_be_instance_of Backend::Redis
    end
  end #detect
end # Backend::Detector

