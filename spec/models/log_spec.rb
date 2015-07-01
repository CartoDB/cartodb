# coding: UTF-8

require_relative '../spec_helper'

include CartoDB

describe CartoDB::Log do

  describe '#basic' do
    it 'checks basic operations' do
      user_id = UUIDTools::UUID.timestamp_create.to_s
      type = Log::TYPE_DATA_IMPORT
      text1 = 'test'
      text2 = 'anothertest'
      timestamp = Time.now.utc
      expectation = (Log::ENTRY_FORMAT % [ timestamp, text1 ]) + (Log::ENTRY_FORMAT % [ timestamp, text2 ])

      log = Log.new({ type: type })
      log.append(text1, timestamp)
      log.append(text2, timestamp)
      # Only stores now upon explicit change
      log.store
      log_id = log.id

      log = Log.where(id:log_id).first
      log.id.should eq log_id
      log.type.should eq type
      log.to_s.should eq expectation
    end
  end

  describe '#circular buffer logic' do
    it 'checks that buffer half works as expected' do
      max_entries_per_half = 2

      timestamp = Time.now.utc
      text1 = "1"
      text2 = "2"
      text3 = "3"
      text4 = "4"
      text5 = "5"
      text6 = "6"

      log = Log.new({ type: Log::TYPE_DATA_IMPORT })
      log.stubs(:half_max_size).returns(max_entries_per_half)

      # Fixed half
      log.append(text1, timestamp)
      log.append(text2, timestamp)
      # circular half
      10.times do 
        log.append('to be deleted', timestamp)
      end
      log.append(text3, timestamp)
      log.append(text4, timestamp)

      log.to_s.should eq (Log::ENTRY_FORMAT % [ timestamp, text1 ]) + 
                            (Log::ENTRY_FORMAT % [ timestamp, text2 ]) + 
                            (Log::ENTRY_FORMAT % [ timestamp, text3 ]) + 
                            (Log::ENTRY_FORMAT % [ timestamp, text4 ])

      log.append(text5, timestamp)
      log.to_s.should eq (Log::ENTRY_FORMAT % [ timestamp, text1 ]) + 
                            (Log::ENTRY_FORMAT % [ timestamp, text2 ]) + 
                            (Log::ENTRY_FORMAT % [ timestamp, text5 ]) + 
                            (Log::ENTRY_FORMAT % [ timestamp, text4 ])

      log.append(text6, timestamp)
      log.to_s.should eq (Log::ENTRY_FORMAT % [ timestamp, text1 ]) + 
                            (Log::ENTRY_FORMAT % [ timestamp, text2 ]) + 
                            (Log::ENTRY_FORMAT % [ timestamp, text5 ]) + 
                            (Log::ENTRY_FORMAT % [ timestamp, text6 ])
    end

    it 'checks that loading a log with existing entries works' do
      max_entries_per_half = 2

      timestamp = Time.now.utc
      text1 = "aaa"
      text2 = "bbb"
      text3 = "3.4"
      text4 = "5 6 7 8"

      Log.any_instance.stubs(:half_max_size).returns(max_entries_per_half)

      log = Log.new({ type: Log::TYPE_DATA_IMPORT })

      log.append(text1, timestamp)
      log.append(text2, timestamp)
      log.append(text3, timestamp)
      log.append(text4, timestamp)
      log.store

      #reload
      log = Log.where(id: log.id).first

      log.send(:collect_entries).should eq (Log::ENTRY_FORMAT % [ timestamp, text1 ]) + 
                                           (Log::ENTRY_FORMAT % [ timestamp, text2 ]) + 
                                           (Log::ENTRY_FORMAT % [ timestamp, text3 ]) + 
                                           (Log::ENTRY_FORMAT % [ timestamp, text4 ])

      log.to_s.should eq (Log::ENTRY_FORMAT % [ timestamp, text1 ]) + 
                         (Log::ENTRY_FORMAT % [ timestamp, text2 ]) + 
                         (Log::ENTRY_FORMAT % [ timestamp, text3 ]) + 
                         (Log::ENTRY_FORMAT % [ timestamp, text4 ])

      # More tests
      log = Log.new({ type: Log::TYPE_DATA_IMPORT })
      log.append(text1, timestamp)
      log.append(text2, timestamp)
      log.append(text3, timestamp)
      log.store
      log = Log.where(id: log.id).first

      log.send(:collect_entries).should eq (Log::ENTRY_FORMAT % [ timestamp, text1 ]) + 
                                           (Log::ENTRY_FORMAT % [ timestamp, text2 ]) + 
                                           (Log::ENTRY_FORMAT % [ timestamp, text3 ])


      log = Log.new({ type: Log::TYPE_DATA_IMPORT })
      log.append(text1, timestamp)
      log.store
      log = Log.where(id: log.id).first

      log.send(:collect_entries).should eq (Log::ENTRY_FORMAT % [ timestamp, text1 ])

      # This test checks that old logs with more lines than accepted get truncated correctly
      log = Log.new({ type: Log::TYPE_DATA_IMPORT })
      Log.any_instance.stubs(:half_max_size).returns(max_entries_per_half*2)
      log.append(text1, timestamp)
      log.append(text2, timestamp)
      log.append('filll', timestamp)
      log.append('filll more', timestamp)
      # This goes to the circular area
      log.append('filll even more', timestamp)
      log.append(text3, timestamp)
      log.append(text4, timestamp)
      log.store

      Log.any_instance.stubs(:half_max_size).returns(max_entries_per_half)
      log = Log.where(id: log.id).first

      log.send(:collect_entries).should eq (Log::ENTRY_FORMAT % [ timestamp, text1 ]) + 
                                           (Log::ENTRY_FORMAT % [ timestamp, text2 ]) + 
                                           (Log::ENTRY_FORMAT % [ timestamp, text3 ]) + 
                                           (Log::ENTRY_FORMAT % [ timestamp, text4 ])
    end

    it 'checks zero case of a new log' do
      log = Log.new({ type: Log::TYPE_DATA_IMPORT })
      log.to_s.should eq ''
      log = Log.where(id: log.id).first
      log.to_s.should eq ''
    end
  end

end
