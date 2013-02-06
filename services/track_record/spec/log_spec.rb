# encoding: utf-8
require 'minitest/autorun'
require_relative '../log'

include TrackRecord

describe Log do
  describe '#append' do
    it 'adds a new entry to the log' do
      log = Log.new
      log.append('bogus message')
      log.map { |entry| entry.text }.must_include 'bogus message'
    end
  end #append

  describe '#each' do
    it 'yields entries sorted by their timestamp, in ascending order' do
      log = Log.new
      log.append('first message')
      log.append('second message')

      log.to_a.first.text .must_match /first/
      log.to_a.last.text  .must_match /second/
    end
  end #each

  describe '#to_s' do
    it 'renders a string representation of the log entries' do
      log = Log.new
      log.append('sample message')
      log.to_s.must_match /sample message/
    end
  end #to_s
end # Log

