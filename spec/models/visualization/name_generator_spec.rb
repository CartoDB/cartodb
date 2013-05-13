# encoding: utf-8
require 'ostruct'
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/name_generator'

include CartoDB

describe Visualization::NameGenerator do
  describe '#generate' do
    it 'returns the candidate name if available' do
      user        = Object.new
      candidate   = 'Non existing name'
      checker     = positive_checker
      generator   = Visualization::NameGenerator.new(user, checker)
      generator.name(candidate).should == candidate
    end

    it 'returns an altered name if no available candidate' do
      user        = Object.new
      existing    = 'visualization 1'
      checker     = negative_checker
      generator   = Visualization::NameGenerator.new(user, checker)

      generator.name(existing).should_not == existing
    end

    it 'returns a generated name if no candidate' do
      user        = Object.new
      checker     = negative_checker
      generator   = Visualization::NameGenerator.new(user, checker)

      generator.name.should =~ /#{Visualization::NameGenerator::PATTERN}/
    end
  end

  def positive_checker
    checker = Object.new
    def checker.available?(*args); true; end
    checker
  end #positive_checker

  def negative_checker
    checker = Object.new
    def checker.available?(candidate)
      existing = [
        'visualization 1',
        'Untitled visualization',
        'Untitled visualization 0',
        'Untitled visualization 1',
      ]
      !existing.include?(candidate)
    end
    checker
  end #negative_checker
end # Visualization::NameGenerator

