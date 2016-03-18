# encoding utf-8

require_relative '../../spec_helper_min.rb'
require_relative '../../../lib/carto/bolt.rb'

module Carto
  describe Bolt do
    before(:each) do
      @bolt = Carto::Bolt.new('manolo')
    end

    it 'should allow for custom ttl_ms' do
      Carto::Bolt.new('manolo', ttl_ms: 1234).info.should include(ttl_ms: 1234)
    end

    it 'should return false on unlock if already unlocked' do
      @bolt.unlock.should be_false
    end

    it 'should expect block' do
      expect { @bolt.lock.should_raise }.to raise_error('no block given')
    end

    it 'should allow access in block if locked and unlocked automatically' do
      @bolt.lock {}.should be_true

      @bolt.unlock.should be_false
    end

    it 'should not allow access if locked' do
      @bolt.lock { @bolt.lock {}.should be_false }.should be_true

      @bolt.unlock.should be_false
    end

    it 'should handle unlock in lock block' do
      got_locked = @bolt.lock do
        @bolt.unlock.should be_true
      end

      got_locked.should be_true

      @bolt.unlock.should be_false
    end

    it 'should expire a lock after ttl_ms' do
      bolt = Carto::Bolt.new('manolo', ttl_ms: 200)

      got_locked = bolt.lock do
        sleep(0.5.second)

        bolt.unlock.should be_false
      end

      got_locked.should be_true
    end
  end
end
