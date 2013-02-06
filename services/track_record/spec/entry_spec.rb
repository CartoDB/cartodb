# encoding: utf-8
require 'minitest/autorun'
require_relative '../entry'

include TrackRecord

describe Entry do
  describe '#initialize' do
    it 'takes some text' do
      lambda { Entry.new }.must_raise ArgumentError

      text = 'bogus'
      Entry.new(text).text.must_equal text
    end
  end #initialize

  describe '#<=>' do
    it 'returns -1 if the passed argument has a later timestamp' do
      first_entry   = Entry.new('first')
      second_entry  = Entry.new('second')

      (first_entry  <=> second_entry).must_equal -1
      (second_entry <=> first_entry).must_equal 1
    end #<=>
  end #<=>

  describe '#to_s' do
    it 'renders a string representation of the entry' do
      entry = Entry.new('bogus')
      entry.to_s.must_match /bogus/
    end

    it 'adjust times to UTC' do
      entry = Entry.new('bogus')
      entry.to_s.must_match /UTC/
    end
  end #to_s
end # Entry

