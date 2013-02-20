# encoding: utf-8
require 'minitest/autorun'
require_relative '../spec_helper'
require_relative '../../track_record/entry'
require_relative '../../../data-repository/backend/redis'

include TrackRecord

describe Entry do
  describe '#initialize' do
    it 'takes a payload' do
      lambda { Entry.new }.must_raise ArgumentError

      entry = Entry.new(text: 'bogus')
      entry.payload.fetch('text').must_equal 'bogus'
    end

    it 'adds a default :message key in the payload if none given' do
      entry = Entry.new('bogus')
      entry.payload.keys.must_equal ['message']
    end
  end #initialize

  describe '#payload' do
    it "can't be changed after initialization" do
      entry = Entry.new(text: 'bogus')
      entry.payload.store(:text, 'changed')

      entry.payload.fetch('text').must_equal 'bogus'

      entry.payload.store(:new_field, 'bogus')
      entry.payload.keys.wont_include 'new_field'
    end 
  end #payload

  describe '#timestamp' do
    it 'is a float' do
      entry = Entry.new(text: 'bogus')
      entry.timestamp.must_be_instance_of Float
    end

    it 'is set at initialiation' do
      Entry.new(text: 'bogus').timestamp.wont_be_nil
    end
  end #timestamp

  describe '#timestamp=' do
    it 'assigns the timestamp, converting it to float' do
      entry = Entry.new(text: 'bogus')

      entry.timestamp = Time.now
      entry.timestamp.must_be_instance_of Float
    end
  end #timestamp=

  describe '#created_at' do
    it 'is a time object' do
      entry = Entry.new(text: 'bogus')
      entry.created_at.must_be_instance_of Time
    end

    it 'is set at initialization' do
      Entry.new(text: 'bogus').created_at.wont_be_nil
    end
  end #created_at

  describe '#created_at=' do
    it 'assigns the created_at, converting it to UTC timezone' do
      entry = Entry.new(text: 'bogus')
      lambda { entry.created_at = nil }.must_raise ArgumentError

      entry = Entry.new(text: 'bogus')
      entry.created_at = Time.now
      entry.created_at.to_s.must_match /UTC/
    end
  end #created_at=

  describe '#<=>' do
    it 'returns -1 if the passed argument has a later timestamp' do
      first_entry   = Entry.new(text: 'first')
      second_entry  = Entry.new(text: 'second')

      (first_entry  <=> second_entry).must_equal -1
      (second_entry <=> first_entry).must_equal 1
    end
  end #<=>

  describe '#to_hash' do
    it 'returns a hash representation with stringified keys' do
      entry = Entry.new(text: 'bogus')
      entry.to_hash.keys.must_include 'timestamp'
      entry.to_hash.keys.must_include 'created_at'
      entry.to_hash.keys.must_include 'payload'
      
      entry.payload.store(:foo, 'bar')
      entry.to_hash.fetch('payload').fetch('text').must_equal 'bogus'
    end

    it 'adjusts created_at to UTC' do
      entry = Entry.new(text: 'bogus')
      entry.to_hash.fetch('created_at').to_s.must_match /UTC/
    end
  end #to_hash

  describe '#to_s' do
    it 'returns a string representation of the entry' do
      entry = Entry.new(text: 'bogus')
      entry.to_s.must_match /bogus/
    end

    it 'converts the created_at time to ISO 8601' do
      entry         = Entry.new(text: 'bogus')
      iso8601_time  = entry.to_s.split(Entry::FIELD_SEPARATOR).first

      Time.iso8601(iso8601_time)  .must_be_instance_of Time
      Time.iso8601(iso8601_time)  .must_equal entry.created_at
    end
  end #to_s

  describe '#persist' do
    it 'persists this entry in the data repository' do
      repository  = DataRepository::Repository.new
      entry       = Entry.new({ text: 'bogus' }, nil, repository)

      entry.persist
      repository.keys.must_include entry.storage_key
    end #persist
  end #persist

  describe '#fetch' do
    it 'updates the entry with data retrieved from the repository' do
      repository      = DataRepository::Repository.new
      entry           = Entry.new({ text: 'bogus' }, nil, repository)

      entry.persist

      retrieved_entry = Entry.new({ id: entry.id }, nil, repository)

      retrieved_entry.payload.must_be_empty
      retrieved_entry.fetch

      retrieved_entry.payload.fetch('text')
        .must_equal entry.payload.fetch('text')
    end
  end #fetch

  describe '#storage_key' do
    it 'is based on the id' do
      entry = Entry.new(text: 'bogus')
      entry.storage_key.must_match entry.id
    end #storage_key
  end #storage_key
end # Entry

