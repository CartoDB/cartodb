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

  describe CartoDB::CentralCommunicationFailure do
    describe '#user_message' do
      it 'supports single error JSON messages' do
        error = 'Something is really broken'
        response = mock
        response.stubs(:code).returns(403)
        response.stubs(:body).returns("{\"errors\":\"#{error}\"}")
        e = CartoDB::CentralCommunicationFailure.new(response)
        e.user_message.should eq "There was a problem with authentication server. #{error}"
      end

      it 'supports multiple error JSON messages' do
        response = mock
        response.stubs(:code).returns(403)
        response.stubs(:body).returns("{\"errors\":[\"A\", \"B\"]}")
        e = CartoDB::CentralCommunicationFailure.new(response)
        e.user_message.should eq "There was a problem with authentication server. A ; B"
      end
    end
  end
end
