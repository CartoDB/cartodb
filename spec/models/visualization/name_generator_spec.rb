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

    it 'accepts names with non-ASCII characters' do
      user        = Object.new
      checker     = positive_checker
      candidate   = 'Me gustan los ñúes'
      generator   = Visualization::NameGenerator.new(user, checker)
      generator.name(candidate).should == candidate
    end

    it 'strips leading and trailing whitespace from candidates' do
      user        = Object.new
      checker     = positive_checker
      candidate   = '      viva la pepa     '
      generator   = Visualization::NameGenerator.new(user, checker)
      generator.name(candidate).should == 'viva la pepa'
    end

    it 'assigns a valid name if a explicit nil candidate is passed' do
      user        = Object.new
      checker     = positive_checker
      candidate   = '      viva la pepa     '
      generator   = Visualization::NameGenerator.new(user, checker)
      generator.name(nil).should == Visualization::NameGenerator::PATTERN
    end

    it 'assigns an incremental number' do
      user = Object.new
      candidate = 'Untitled map'
      Visualization::NameGenerator.new(user, negative_checker([])).name(candidate).should == candidate
      Visualization::NameGenerator.new(user, negative_checker([candidate])).name(candidate).should == "#{candidate} 1"
      Visualization::NameGenerator.new(user, negative_checker([candidate, "#{candidate} 1"])).name(candidate).should == "#{candidate} 2"
      Visualization::NameGenerator.new(user, negative_checker([candidate, "#{candidate} 1", "#{candidate} 2"])).name(candidate).should == "#{candidate} 3"
    end
  end

  def positive_checker
    checker = Object.new
    def checker.available?(*args); true; end
    checker
  end

  def negative_checker(existing = [ 'visualization 1', 'Untitled visualization', 'Untitled visualization 0', 'Untitled visualization 1'])
    checker = OpenStruct.new
    checker.existing = existing
    def checker.available?(candidate)
      !existing.include?(candidate)
    end
    checker
  end
end

