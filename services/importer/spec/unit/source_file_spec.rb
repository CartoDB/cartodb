# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/source_file'

include CartoDB::Importer2

describe SourceFile do
  describe '#basename' do
    it 'returns the name without extension' do
      source_file = SourceFile.new('/var/tmp/foo.txt')
      source_file.name.must_equal 'foo'

      source_file = SourceFile.new('/var/tmp/foo')
      source_file.name.must_equal 'foo'

      source_file = SourceFile.new("/var/tmp/#{Time.now.to_f}", 'foo.txt')
      source_file.name.must_equal 'foo'

      source_file = SourceFile.new("/var/tmp/#{Time.now.to_f}", 'foo')
      source_file.name.must_equal 'foo'
    end
  end #basename

  describe '#extension' do
    it 'returns the extension, if any' do
      source_file = SourceFile.new('/var/tmp/foo.txt')
      source_file.extension.must_equal '.txt'

      source_file = SourceFile.new('/var/tmp/foo')
      source_file.extension.must_be_empty

      source_file = SourceFile.new("/var/tmp/#{Time.now.to_f}", 'foo.txt')
      source_file.extension.must_equal '.txt'

      source_file = SourceFile.new("/var/tmp/#{Time.now.to_f}", 'foo')
      source_file.extension.must_be_empty
    end
  end #extension

  describe '#fullpath' do
    it 'returns the full path' do
      source_file = SourceFile.new('/var/tmp/foo.txt')
      source_file.fullpath.must_equal '/var/tmp/foo.txt'

      source_file = SourceFile.new('/var/tmp/foo')
      source_file.fullpath.must_equal '/var/tmp/foo'

      time = Time.now.to_f
      source_file = SourceFile.new("/var/tmp/#{time}", 'foo.txt')
      source_file.fullpath.must_equal "/var/tmp/#{time}.txt"

      source_file = SourceFile.new("/var/tmp/#{time}", 'foo')
      source_file.fullpath.must_equal "/var/tmp/#{time}"
    end
  end #fullpath

  describe '#path' do
    it 'returns the file name with extension' do
      source_file = SourceFile.new('/var/tmp/foo.txt')
      source_file.path.must_equal 'foo.txt'

      source_file = SourceFile.new('/var/tmp/foo')
      source_file.path.must_equal 'foo'

      time = Time.now.to_f
      source_file = SourceFile.new("/var/tmp/#{time}", 'foo.txt')
      source_file.path.must_equal "#{time}.txt"

      source_file = SourceFile.new("/var/tmp/#{time}", 'foo')
      source_file.path.must_equal "#{time}"
    end
  end #path 

  describe '#target_schema' do
    it "returns 'cdb_importer'" do
      source_file = SourceFile.new('/var/tmp/foo.txt')
      source_file.target_schema.must_equal 'cdb_importer'

      source_file = SourceFile.new('/var/tmp/foo')
      source_file.target_schema.must_equal 'cdb_importer'
    end
  end #target_schema

  describe '#encoding' do
    it 'returns the encoding if embedded in the filepath' do
      filepath    = "/var/tmp/foo_encoding_UTF-8_encoding_.csv"
      source_file = SourceFile.new(filepath)
      source_file.encoding.must_equal 'UTF-8'

      filepath    = "/var/tmp/foo_encoding_WIN1252_encoding_.csv"
      source_file = SourceFile.new(filepath)
      source_file.encoding.must_equal 'WIN1252'

      filepath    = "/var/tmp/foo_encoding_LATIN1_encoding_.csv"
      source_file = SourceFile.new(filepath)
      source_file.encoding.must_equal 'LATIN1'
    end

    it 'returns nil if no encoding embedded in the filepath' do
      source_file = SourceFile.new('/var/tmp/foo.csv')
      source_file.encoding.must_be_nil
    end
  end
end # SourceFile

