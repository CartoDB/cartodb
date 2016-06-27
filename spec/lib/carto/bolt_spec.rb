# encoding utf-8

require_relative '../../spec_helper_min.rb'
require_relative '../../../lib/carto/bolt.rb'

module Carto
  describe Bolt do
    before(:each) do
      @bolt = Carto::Bolt.new('manolo_bolt_locked')
    end

    it 'should expect block' do
      expect { @bolt.run_locked.should_raise }.to raise_error('no code block given')
    end

    it 'should allow access in block if locked and unlocked automatically' do
      bolt = Carto::Bolt.new('manolo_bolt_locked', ttl_ms: 60000)

      bolt.run_locked {}.should be_true
      bolt.run_locked {}.should be_true
    end

    it 'should not allow access if locked' do
      other_bolt = Carto::Bolt.new('manolo_bolt_locked')

      @bolt.run_locked { other_bolt.run_locked {}.should be_false }.should be_true
    end

    it 'should expire a lock after ttl_ms' do
      ttl_ms = 200

      bolt = Carto::Bolt.new('manolo_bolt_locked', ttl_ms: ttl_ms)

      bolt.run_locked do
        sleep((ttl_ms * 2 / 1000.0).second)

        Carto::Bolt.new('manolo_bolt_locked').run_locked {}.should be_true
      end
    end
  end
end
