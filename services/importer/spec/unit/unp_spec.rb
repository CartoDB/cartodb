# encoding: utf-8
require 'fileutils'
require_relative '../../lib/importer/unp'
require_relative '../../../../spec/rspec_configuration.rb'

include CartoDB::Importer2

describe Unp do
  describe '#run' do
    it 'extracts the contents of the file' do
      zipfile   = zipfile_factory
      unp       = Unp.new

      unp.run(zipfile)
      (Dir.entries(unp.temporary_directory).size > 2).should eq true
    end

    it 'populates a list of source files' do
      zipfile   = zipfile_factory
      unp       = Unp.new
      
      unp.source_files.should be_empty
      unp.run(zipfile)
      unp.source_files.should_not be_empty
    end

    it 'populates a single source file for the passed path if not compressed' do
      unp       = Unp.new

      unp.source_files.should be_empty
      unp.run(zipfile_factory)
      unp.source_files.length.should eq 2
    end
  end #run

  describe '#without_unpacking' do
    it 'pushes a source file for the passed file path to the source files' do
      unp       = Unp.new

      unp.source_files.should be_empty
      unp.without_unpacking(zipfile_factory)
      unp.source_files.size.should eq 1
    end
  end #withount_unpacking

  describe '#compressed?' do
    it 'returns true if extension denotes a compressed file' do
      unp       = Unp.new

      unp.compressed?('bogus.gz').should eq true
      unp.compressed?('bogus.csv').should eq false
    end
  end #compressed?

  describe '#process' do
    it 'adds a source_file for the path if extension supported' do
      unp = Unp.new

      unp.source_files.should be_empty
      unp.process('/var/tmp/foo.csv')

      unp.source_files.should_not be_empty
      unp.source_files.first.should be_an_instance_of SourceFile
    end
  end #process

  describe '#crawl' do
    it 'returns a list of full paths for files in the directory' do
      fixture1  = '/var/tmp/bogus1.csv'
      fixture2  = '/var/tmp/bogus2.csv'
      FileUtils.touch(fixture1)
      FileUtils.touch(fixture2)

      unp       = Unp.new
      files     = unp.crawl('/var/tmp')

      files.should include(fixture1)
      files.should include(fixture2)

      FileUtils.rm(fixture1)
      FileUtils.rm(fixture2)
    end
  end #crawl

  describe '#extract' do
    it 'generates a temporary directory' do
      dir       = '/var/tmp/bogus'
      zipfile   = zipfile_factory(dir)
      unp       = Unp.new.extract(zipfile)

      File.directory?(unp.temporary_directory).should eq true

      FileUtils.rm_r(dir)
    end

    it 'extracts the contents of the file into the temporary directory' do
      dir       = '/var/tmp/bogus'
      zipfile   = zipfile_factory(dir)
      unp       = Unp.new.extract(zipfile)

      (Dir.entries(unp.temporary_directory).size > 2).should eq true

      FileUtils.rm_r(dir)
    end

    it 'raises if unp could not extract the file' do
      expect { Unp.new.extract('/var/tmp/non_existent.zip') }.to raise_error ExtractionError
    end
  end #extract

  describe '#source_file_for' do
    it 'returns a source_file for the passed path' do
      Unp.new.source_file_for('/var/tmp/foo.txt')
        .should be_an_instance_of SourceFile
    end
  end #source_file_for

  describe '#command_for' do
    it 'returns the unp command line to be executed' do
      unp = Unp.new

      unp.command_for('bogus').should match /.*unp.*bogus.*/
    end

    it 'raises if unp is not found' do
      Open3.expects('capture3').with('which unp').returns [0, 0, 1]
      unp = Unp.new

      expect { unp.command_for('wadus') }.to raise_error InstallError
    end
  end #command_for

  describe '#supported?' do
    it 'returns true if file extension is supported' do
      unp = Unp.new

      unp.supported?('foo.doc').should eq false
      unp.supported?('foo.xls').should eq true
    end
  end #supported?

  describe '#normalize' do
    it 'underscores the file name' do
      fixture   = "/var/tmp/#{Time.now.to_i} with spaces.txt"
      File.open(fixture, 'w').close

      new_name  = Unp.new.normalize(fixture)
      new_name.should match(/with_spaces/)
    end

    it 'renames the file to the underscored file name' do
      fixture   = "/var/tmp/#{Time.now.to_i} with spaces.txt"
      File.open(fixture, 'w').close

      unp = Unp.new
      unp.normalize(fixture)

      File.exists?(fixture).should eq false
    end
  end #normalize

  describe '#underscore' do
    it 'substitutes spaces for underscores in the file name' do
      fixture   = "/var/tmp/#{Time.now.to_i} with spaces.txt"
      new_name  = Unp.new.underscore(fixture)
      new_name.should match(/with_spaces/)
    end

    it 'converts the file name to downcase' do
      fixture   = "/var/tmp/#{Time.now.to_i}.txt"
      new_name  = '/var/tmp/foo.txt'
      File.open(fixture, 'w').close
    end
  end #underscore

  describe '#rename' do
    it 'renames a file' do
      fixture   = "/var/tmp/#{Time.now.to_i}.txt"
      new_name  = '/var/tmp/foo.txt'
      File.open(fixture, 'w').close

      unp = Unp.new
      unp.rename(fixture, new_name)

      File.exists?(fixture).should eq false
      File.exists?(new_name).should eq true

      FileUtils.rm(new_name)
    end

    it 'does nothing if destination file name is the same as the original' do
      fixture   = "/var/tmp/#{Time.now.to_i}.txt"
      File.open(fixture, 'w').close

      unp = Unp.new
      unp.rename(fixture, fixture)

      File.exists?(fixture).should eq true
    end
  end #rename

  describe '#generate_temporary_directory' do
    it 'creates a temporary directory' do
      unp = Unp.new
      unp.generate_temporary_directory
      File.directory?(unp.temporary_directory).should eq true
    end

    it 'sets the temporary_directory instance variable' do
      unp = Unp.new

      unp.instance_variable_get(:@temporary_directory).should eq nil
      unp.generate_temporary_directory
      unp.temporary_directory.should_not eq nil
    end
  end #generate_temporary_directory

  describe '#hidden?' do
    it 'returns true if filename starts with a dot' do
      unp = Unp.new
      unp.hidden?('.bogus').should eq true
      unp.hidden?('bogus').should eq false
    end

    it 'returns true if filename starts with two underscores' do
      unp = Unp.new
      unp.hidden?('__bogus').should eq true
      unp.hidden?('_bogus').should eq false
    end
  end #hidden?

  describe '#unp_failure?'  do
    it 'returns true if unp cannot read the file' do
      Unp.new.unp_failure?('Cannot read', 0).should eq true
    end

    it 'returns true if returned an error exit code' do
      Unp.new.unp_failure?('', 999).should eq true
    end
  end #unp_failure?

  def zipfile_factory(dir='/var/tmp/bogus')
    filename = 'bogus.zip'

    zipfile = "#{dir}/#{filename}"

    FileUtils.rm(zipfile) if File.exists?(zipfile)
    FileUtils.rm_r(dir)   if File.exists?(dir)
    FileUtils.mkdir_p(dir)

    FileUtils.cp(File.join(File.dirname(__FILE__), "../fixtures/#{filename}"), zipfile)

    zipfile
  end
end #Unp

