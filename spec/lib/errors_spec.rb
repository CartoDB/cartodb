# coding: UTF-8

require 'spec_helper'

describe CartoDB do
  describe '#base_cartodb_error' do

    it 'Tests usage of the base cartodb exception/error' do
      error_message = 'something !!!'
      nested_exception = StandardError.new('123456 cartodb')

      expect {
        begin
          raise nested_exception
        rescue StandardError => exc
          raise CartoDB::BaseCartoDBError.new(error_message, exc)
        end
      }.to raise_exception CartoDB::BaseCartoDBError

      begin
        begin
          raise nested_exception
        rescue StandardError => exc
          raise CartoDB::BaseCartoDBError.new(error_message, exc)
        end
      rescue CartoDB::BaseCartoDBError => our_exception
        our_exception.backtrace.should eq nested_exception.backtrace
        our_exception.message.should eq (error_message + CartoDB::BaseCartoDBError::APPENDED_MESSAGE_PREFIX + nested_exception.message)
      end
    end

  end
end
