require_relative '../../lib/importer/source_file'

include CartoDB::Importer2

describe SourceFile do
  describe '#basename' do
    it 'returns the name without extension' do
      source_file = SourceFile.new('/var/tmp/foo.txt')
      source_file.name.should eq 'foo'

      source_file = SourceFile.new('/var/tmp/foo')
      source_file.name.should eq 'foo'

      source_file = SourceFile.new("/var/tmp/#{Time.now.to_f}", 'foo.txt')
      source_file.name.should eq 'foo'

      source_file = SourceFile.new("/var/tmp/#{Time.now.to_f}", 'foo')
      source_file.name.should eq 'foo'
    end
  end #basename

  describe '#extension' do
    it 'returns the extension, if any' do
      source_file = SourceFile.new('/var/tmp/foo.txt')
      source_file.extension.should eq '.txt'

      source_file = SourceFile.new('/var/tmp/foo')
      source_file.extension.should be_empty

      source_file = SourceFile.new("/var/tmp/#{Time.now.to_f}", 'foo.txt')
      source_file.extension.should eq '.txt'

      source_file = SourceFile.new("/var/tmp/#{Time.now.to_f}", 'foo')
      source_file.extension.should be_empty
    end
  end #extension

  describe '#fullpath' do
    it 'returns the full path' do
      source_file = SourceFile.new('/var/tmp/foo.txt')
      source_file.fullpath.should eq '/var/tmp/foo.txt'

      source_file = SourceFile.new('/var/tmp/foo')
      source_file.fullpath.should eq '/var/tmp/foo'

      time = Time.now.to_f
      source_file = SourceFile.new("/var/tmp/#{time}", 'foo.txt')
      source_file.fullpath.should eq "/var/tmp/#{time}.txt"

      source_file = SourceFile.new("/var/tmp/#{time}", 'foo')
      source_file.fullpath.should eq "/var/tmp/#{time}"
    end
  end #fullpath

  describe '#path' do
    it 'returns the file name with extension' do
      source_file = SourceFile.new('/var/tmp/foo.txt')
      source_file.path.should eq 'foo.txt'

      source_file = SourceFile.new('/var/tmp/foo')
      source_file.path.should eq 'foo'

      time = Time.now.to_f
      source_file = SourceFile.new("/var/tmp/#{time}", 'foo.txt')
      source_file.path.should eq "#{time}.txt"

      source_file = SourceFile.new("/var/tmp/#{time}", 'foo')
      source_file.path.should eq "#{time}"
    end
  end #path 

  describe '#target_schema' do
    it "returns 'cdb_importer'" do
      source_file = SourceFile.new('/var/tmp/foo.txt')
      source_file.target_schema.should eq 'cdb_importer'

      source_file = SourceFile.new('/var/tmp/foo')
      source_file.target_schema.should eq 'cdb_importer'
    end
  end #target_schema

  describe '#encoding' do
    it 'returns the encoding if embedded in the filepath' do
      filepath    = "/var/tmp/foo_encoding_UTF-8_encoding_.csv"
      source_file = SourceFile.new(filepath)
      source_file.encoding.should eq 'UTF-8'

      filepath    = "/var/tmp/foo_encoding_WIN1252_encoding_.csv"
      source_file = SourceFile.new(filepath)
      source_file.encoding.should eq 'WIN1252'

      filepath    = "/var/tmp/foo_encoding_LATIN1_encoding_.csv"
      source_file = SourceFile.new(filepath)
      source_file.encoding.should eq 'LATIN1'
    end

    it 'returns nil if no encoding embedded in the filepath' do
      source_file = SourceFile.new('/var/tmp/foo.csv')
      source_file.encoding.should_not be
    end
  end
end # SourceFile

