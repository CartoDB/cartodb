# encoding: utf-8

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

    it 'should wait for execution if we pass attempts parameters' do
      main = Thread.new do
        @bolt.run_locked {
          sleep(1)
        }.should be_true
      end
      thr = Thread.new do
        flag = false
        Carto::Bolt.new('manolo_bolt_locked').run_locked(attempts: 5, timeout: 1000) { flag = true }
        flag.should be_true
      end
      thr.join
      main.join
    end

    it 'should wait for execution and exit without complete it if timeout and retries reach the limit' do
      main = Thread.new do
        @bolt.run_locked {
          sleep(1)
        }.should be_true
      end
      thr = Thread.new do
        flag = false
        Carto::Bolt.new('manolo_bolt_locked').run_locked(attempts: 5, timeout: 1) { flag = true }
        flag.should be_false
      end
      thr.join
      main.join
    end

    it 'should retry an execution when other process tries to acquire bolt and has retriable flag set' do
      main = Thread.new do
        flag = 0
        @bolt.run_locked(rerun_func: lambda { flag += 1 }) {
          flag += 1
          sleep(1)
        }.should be_true
        flag.should eq(2)
      end
      thr = Thread.new do
        Carto::Bolt.new('manolo_bolt_locked').run_locked {}.should be_false
      end
      thr.join
      main.join
    end

    it 'should execute once the rerun_func part despite of the number of calls to acquire the lock' do
      main = Thread.new do
        flag = 0
        rerun_func = lambda do
          sleep(1)
          flag += 1
        end
        @bolt.run_locked(rerun_func: rerun_func) {
          flag += 1
          sleep(1)
        }.should be_true
        flag.should > 2
      end
      5.times do
        t = Thread.new do
          Carto::Bolt.new('manolo_bolt_locked').run_locked {}
          sleep(1.0 / 4.0)
        end
        t.join
      end
      main.join
    end

    it 'should raise error if rerun_func is not a lambda' do
      expect {
        @bolt.run_locked(rerun_func: "lala") {}.should_raise
      }.to raise_error('no proc/lambda passed as rerun_func')
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
