require 'active_support'
require 'active_support/core_ext/object/blank'
require_relative '../../../lib/carto/filename_generator'

describe Carto::FilenameGenerator do
  class TestFilenameGenerator
    include Carto::FilenameGenerator
  end

  describe '#filename_from_url' do
    let(:generator) { TestFilenameGenerator.new }
    let(:supported_extensions) { %w(.csv .carto .zip) }

    it 'returns the full url for just filenames' do
      ['a_name.csv', 'a_name.carto'].each do |filename|
        generator.filename_from_url(filename, supported_extensions).should eq filename
      end
    end

    it 'returns nil for unsupported extensions' do
      ['a_name.wadus', 'a_name'].each do |filename|
        generator.filename_from_url(filename, supported_extensions).should be_nil
      end
    end

    it 'returns the filename for normal urls' do
      [%w(http://carto.com/name.csv name.csv), %w(http://carto.com/sub/file.carto file.carto)].each do |url, filename|
        generator.filename_from_url(url, supported_extensions).should eq filename
      end
    end

    it 'returns the filename for filenames with dots and other characters' do
      name1 = 'name.something (one - two : three).carto'

      [
        %w(http://carto.com/name.something.csv name.something.csv),
        ["http://carto.com/sub/#{name1.gsub(' ', '%20')}", name1]
      ].each do |url, filename|
        generator.filename_from_url(url, supported_extensions).should eq filename
      end
    end

    it 'returns the filename for weirds URLs with filenames within the parameters (see #5704)' do
      inner_filename = '1259030001_MB_2011_ASGC_NSW_csv.zip'
      weird_url = "http://www.abs.gov.au/ausstats/subscriber.nsf/log?openagent&"\
                  "#{inner_filename}"\
                  "&1259.0.30.001&Data%20Cubes&2787F2FFF3F6E607CA2578CC001268ED&0&July%202011&05.10.2011&Latest"
      [[weird_url, inner_filename]].each do |url, filename|
        generator.filename_from_url(url, supported_extensions).should eq filename
      end
    end
  end
end
