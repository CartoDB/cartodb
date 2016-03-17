# encoding utf-8

require_relative '../../spec_helper_min.rb'

module Carto
  describe 'Bolt' do
    before(:each) do
      @bolt = Carto::Bolt.new('manolo')
    end

    it 'should allow for custom ttl_ms' do
      Carto::Bolt.new('manolo', ttl_ms: 1234).info.should include(ttl_ms: 1234)
    end

    it 'should not allow to lock bolt twice' do
      @bolt.lock.should be_true
      @bolt.lock.should be_false
    end

    it 'should return false on unlock if already unlocked' do
      @bolt.unlock.should be_true
    end

    it 'should perform lock and unlock without block' do
      @bolt.lock.should be_true
      @bolt.unlock.should be_true
    end

    it 'should allow access in block if locked and unlocked automatically' do
      @bolt.lock do |locked|
        locked.should be_true
      end

      @bolt.unlock.should be_false
    end

    it 'should not allow access in block if locked' do
      @bolt.lock.should be_true

      @bolt.lock do |locked|
        locked.should be_false
      end

      @bolt.unlock.should be_true
    end

    it 'should handle unlock in lock block' do
      @bolt.lock do |locked|
        locked.should be_true

        @bolt.unlock.should be_true
      end

      @bolt.unlock.should be_false
    end

    it 'should expire a lock after ttl_ms' do
      bolt = Carto::Bolt.new('manolo', ttl_ms: 200)

      bolt.lock.should be_true

      sleep(0.5.second)

      bolt.unlock.should be_false
    end
  end
end
