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
      # Should save automatically
      log.append(text1, timestamp)
      log.append(text2, timestamp)
      log_id = log.id

      log = Log.where(id:log_id).first
      log.id.should eq log_id
      log.type.should eq type
      log.entries.should eq expectation
    end
  end

end
