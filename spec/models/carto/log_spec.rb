require 'spec_helper_unit'

describe Carto::Log do
  describe '#basic' do
    it 'checks basic operations' do
      type = Carto::Log::TYPE_DATA_IMPORT
      text1 = 'test'
      text2 = 'anothertest'
      timestamp = Time.now.utc

      log = Carto::Log.new({ type: type })
      log.append(text1, false, timestamp)
      log.append(text2, false, timestamp)
      # Only stores now upon explicit change
      log.store
      log_id = log.id

      log = Carto::Log.find(log_id)
      log.id.should eq log_id
      log.type.should eq type
      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::END_OF_LOG_MARK
    end
  end

  describe '#circular buffer logic' do
    it 'checks that buffer half works as expected' do
      max_entries_per_half = 2

      timestamp = Time.now.utc
      text1 = '1'
      text2 = '2'
      text3 = '3'
      text4 = '4'
      text5 = '5'
      text6 = '6'

      Carto::Log.any_instance.stubs(:half_max_size).returns(max_entries_per_half)

      log = Carto::Log.new_data_import

      # Fixed half
      log.append(text1, false, timestamp)
      log.append(text2, false, timestamp)
      # circular half
      10.times do
        log.append('to be deleted', false, timestamp)
      end
      log.append(text3, false, timestamp)
      log.append(text4, false, timestamp)

      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::HALF_OF_LOG_MARK +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text3) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text4) +
                         Carto::Log::END_OF_LOG_MARK

      log.append(text5, false, timestamp)
      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::HALF_OF_LOG_MARK +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text4) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text5) +
                         Carto::Log::END_OF_LOG_MARK

      log.append(text6, false, timestamp)
      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::HALF_OF_LOG_MARK +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text5) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text6) +
                         Carto::Log::END_OF_LOG_MARK
    end

    it 'checks that loading a log with existing entries works' do
      max_entries_per_half = 2

      timestamp = Time.now.utc
      text1 = 'aaa'
      text2 = 'bbb'
      text3 = '3.4'
      text4 = '5 6 7 8'
      text5 = 'five'
      text6 = 'six'

      Carto::Log.any_instance.stubs(:half_max_size).returns(max_entries_per_half)

      log = Carto::Log.new_data_import

      log.append(text1, false, timestamp)
      log.append(text2, false, timestamp)
      log.append(text3, false, timestamp)
      log.append(text4, false, timestamp)
      log.store

      # reload
      log = Carto::Log.find(log.id)

      # collect doesn't beautifies
      log.send(:collect_entries).should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text3) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text4)

      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::HALF_OF_LOG_MARK +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text3) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text4) +
                         Carto::Log::END_OF_LOG_MARK

      # More tests
      log = Carto::Log.new_data_import
      log.append(text1, false, timestamp)
      log.append(text2, false, timestamp)
      log.append(text3, false, timestamp)
      log.store
      log = Carto::Log.find(log.id)

      log.send(:collect_entries).should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text3)
      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::HALF_OF_LOG_MARK +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text3) +
                         Carto::Log::END_OF_LOG_MARK

      # Check that new entries are added correctly
      log.append(text4, false, timestamp)
      log.send(:collect_entries).should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text3) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text4)
      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::HALF_OF_LOG_MARK +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text3) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text4) +
                         Carto::Log::END_OF_LOG_MARK
      log.append(text5, false, timestamp)
      log.append(text6, false, timestamp)
      log.send(:collect_entries).should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text5) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text6)
      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::HALF_OF_LOG_MARK +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text5) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text6) +
                         Carto::Log::END_OF_LOG_MARK

      log = Carto::Log.new_data_import
      log.append(text1, false, timestamp)
      log.store
      log = Carto::Log.find(log.id)

      log.send(:collect_entries).should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1)

      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         Carto::Log::END_OF_LOG_MARK

      # This test checks that old logs with more lines than accepted get truncated correctly
      log = Carto::Log.new_data_import
      log.append(text1, false, timestamp)
      log.append(text2, false, timestamp)
      log.append('fill', false, timestamp)
      log.append('fill more', false, timestamp)
      # This goes to the circular area
      log.append('fill even more', false, timestamp)
      log.append(text3, false, timestamp)
      log.append(text4, false, timestamp)
      log.store

      log = Carto::Log.find(log.id)

      log.send(:collect_entries).should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text3) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text4)
      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::HALF_OF_LOG_MARK +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text3) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text4) +
                         Carto::Log::END_OF_LOG_MARK

      # Nothing should change with this
      log.send(:fix_entries_encoding)
      log.send(:collect_entries).should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text3) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text4)
      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::HALF_OF_LOG_MARK +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text3) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text4) +
                         Carto::Log::END_OF_LOG_MARK
      # Check that new entries are added correctly
      log.append(text5, false, timestamp)
      log.append(text6, false, timestamp)
      log.send(:collect_entries).should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text5) +
                                           format(Carto::Log::ENTRY_FORMAT, timestamp, text6)
      log.to_s.should eq format(Carto::Log::ENTRY_FORMAT, timestamp, text1) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text2) +
                         Carto::Log::HALF_OF_LOG_MARK +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text5) +
                         format(Carto::Log::ENTRY_FORMAT, timestamp, text6) +
                         Carto::Log::END_OF_LOG_MARK
    end

    it 'checks zero case of a new log' do
      log = Carto::Log.new_data_import
      log.to_s.should eq Carto::Log::END_OF_LOG_MARK
      log = Carto::Log.find(log.id)
      log.to_s.should eq Carto::Log::END_OF_LOG_MARK

      # Forcing call without entries
      log.send(:fix_entries_encoding)
      log.to_s.should eq Carto::Log::END_OF_LOG_MARK
    end
  end
end
