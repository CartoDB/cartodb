# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../job/command'

include Workman

describe Job::Command do
  describe '#initialize' do
    it 'requires the full path of an executable' do
      lambda { Job::Command.new }.must_raise ArgumentError
      Job::Command.new('echo').must_be_instance_of Job::Command
    end
  end #initialize

  describe '#run' do
    it 'runs the command and returns the result' do
      command = Job::Command.new('echo', ['foo'])
      command.run.must_match /foo/
    end
  end #run

  describe '#success?' do
    it 'returns true if command was executed successfully' do
      command = Job::Command.new('echo', ['foo'])
      command.run
      command.success?.must_equal true
    end
  end

  describe '#error?' do
    it 'returns true if command returned with errors' do
      command = Job::Command.new('cat', ['non_existent_file'])
      command.run
      command.error?.must_equal true
    end
  end #error?
end # Job::Command

