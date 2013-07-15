# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'fileutils'
require 'zip/zip'
require_relative '../../lib/importer/unp'

include CartoDB::Importer2

describe Unp do
  describe '#run' do
    it 'extracts the contents of the file' do
      zipfile   = zipfile_factory
      job       = Object.new
      unp       = Unp.new(job)

      unp.run(zipfile)
      (Dir.entries(unp.temporary_directory).size > 2).must_equal true
    end

    it 'populates a list of source files' do
      zipfile   = zipfile_factory
      job       = Object.new
      unp       = Unp.new(job)
      
      unp.source_files.must_be_empty
      unp.run(zipfile)
      unp.source_files.wont_be_empty
    end

    it 'populates a single source file for the passed path
    if not compressed' do
      file      = '/var/tmp/bogus.csv'
      job       = Object.new
      unp       = Unp.new(job)
      
      unp.source_files.must_be_empty
      unp.run(file)
      unp.source_files.length.must_equal 1
    end
  end #run

  describe '#without_unpacking' do
    it 'pushes a source file for the passed file path to the source files' do
      job       = Object.new
      unp       = Unp.new(job)

      unp.source_files.must_be_empty
      unp.without_unpacking('bogus.csv')
      unp.source_files.size.must_equal 1
    end
  end #withount_unpacking

  describe '#compressed?' do
    it 'returns true if extension denotes a compressed file' do
      job       = Object.new
      unp       = Unp.new(job)

      unp.compressed?('bogus.gz').must_equal true
      unp.compressed?('bogus.csv').must_equal false
    end
  end #compressed?

  describe '#process' do
    it 'adds a source_file for the path if extension supported' do
      job = Object.new
      unp = Unp.new(job)

      unp.source_files.must_be_empty
      unp.process('/var/tmp/foo.csv')

      unp.source_files.wont_be_empty
      unp.source_files.first.must_be_instance_of SourceFile
    end
  end #process

  describe '#crawl' do
    it 'returns a list of full paths for files in the directory' do
      fixture1  = '/var/tmp/bogus1.csv'
      fixture2  = '/var/tmp/bogus2.csv'
      FileUtils.touch(fixture1)
      FileUtils.touch(fixture2)

      job       = Object.new
      unp       = Unp.new(job)
      files     = unp.crawl('/var/tmp')

      files.must_include(fixture1)
      files.must_include(fixture2)

      FileUtils.rm(fixture1)
      FileUtils.rm(fixture2)
    end
  end #crawl

  describe '#extract' do
    it 'generates a temporary directory' do
      dir       = '/var/tmp/bogus'
      zipfile   = zipfile_factory(dir)
      job       = Object.new
      unp       = Unp.new(job).extract(zipfile)

      File.directory?(unp.temporary_directory).must_equal true

      FileUtils.rm_r(dir)
      FileUtils.rm_r(zipfile)
    end

    it 'extracts the contents of the file into the temporary directory' do
      dir       = '/var/tmp/bogus'
      zipfile   = zipfile_factory(dir)
      job       = Object.new
      unp       = Unp.new(job).extract(zipfile)

      (Dir.entries(unp.temporary_directory).size > 2).must_equal true

      FileUtils.rm_r(dir)
      FileUtils.rm_r(zipfile)
    end

    it 'raises if unp could not extract the file' do
      job = Object.new
      lambda { Unp.new(job).extract('/var/tmp/non_existent.zip') }
        .must_raise ExtractionError
    end
  end #extract

  describe '#source_file_for' do
    it 'returns a source_file for the passed path' do
      job = Object.new
      Unp.new(job).source_file_for('/var/tmp/foo.txt')
        .must_be_instance_of SourceFile
    end
  end #source_file_for

  describe '#command_for' do
    it 'returns the unp command line to be executed' do
      job = Object.new
      unp = Unp.new(job)

      unp.command_for('bogus').must_match /.*unp.*bogus.*/
    end
  end #command_for

  describe '#supported?' do
    it 'returns true if file extension is supported' do
      job = Object.new
      unp = Unp.new(job)

      unp.supported?('foo.doc').must_equal false
      unp.supported?('foo.xls').must_equal true
    end
  end #supported?

  describe '#normalize' do
    it 'underscores the file name' do
      fixture   = "/var/tmp/#{Time.now.to_i} with spaces.txt"
      File.open(fixture, 'w').close

      job       = Object.new
      new_name  = Unp.new(job).normalize(fixture)
      new_name.must_match(/with_spaces/)
    end

    it 'renames the file to the underscored file name' do
      fixture   = "/var/tmp/#{Time.now.to_i} with spaces.txt"
      File.open(fixture, 'w').close

      job = Object.new
      unp = Unp.new(job)
      unp.normalize(fixture)

      File.exists?(fixture).must_equal false
    end
  end #normalize

  describe '#underscore' do
    it 'substitutes spaces for underscores in the file name' do
      fixture   = "/var/tmp/#{Time.now.to_i} with spaces.txt"
      job       = Object.new
      new_name  = Unp.new(job).underscore(fixture)
      new_name.must_match(/with_spaces/)
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

      job = Object.new
      unp = Unp.new(job)
      unp.rename(fixture, new_name)

      File.exists?(fixture).must_equal false
      File.exists?(new_name).must_equal true

      FileUtils.rm(new_name)
    end

    it 'does nothing if destination file name is the same as the original' do
      fixture   = "/var/tmp/#{Time.now.to_i}.txt"
      File.open(fixture, 'w').close

      job = Object.new
      unp = Unp.new(job)
      unp.rename(fixture, fixture)

      File.exists?(fixture).must_equal true
    end
  end #rename

  describe '#generate_temporary_directory' do
    it 'creates a temporary directory' do
      job = Object.new
      unp = Unp.new(job)
      unp.generate_temporary_directory
      File.directory?(unp.temporary_directory).must_equal true
    end

    it 'sets the temporary_directory instance variable' do
      job = Object.new
      unp = Unp.new(job)

      unp.temporary_directory.must_be_nil
      unp.generate_temporary_directory
      unp.temporary_directory.wont_be_nil
    end
  end #generate_temporary_directory

  describe '#hidden?' do
    it 'returns true if filename starts with a dot' do
      job = Object.new
      unp = Unp.new(job)
      unp.hidden?('.bogus').must_equal true
      unp.hidden?('bogus').must_equal false
    end

    it 'returns true if filename starts with two underscores' do
      job = Object.new
      unp = Unp.new(job)
      unp.hidden?('__bogus').must_equal true
      unp.hidden?('_bogus').must_equal false
    end
  end #hidden?

  describe '#unp_failure?'  do
    it 'returns true if unp cannot read the file' do
      job = Object.new
      Unp.new(job).unp_failure?('Cannot read', 0).must_equal true
    end

    it 'returns true if returned an error exit code' do
      job = Object.new
      Unp.new(job).unp_failure?('', 999).must_equal true
    end
  end #unp_failure?

  def zipfile_factory(dir='/var/tmp/bogus')
    fixture1  = '/var/tmp/bogus/bogus1.csv'
    fixture2  = '/var/tmp/bogus/bogus2.csv'
    zipfile   = '/var/tmp/bogus.zip'

    FileUtils.rm(zipfile) if File.exists?(zipfile)
    FileUtils.rm_r(dir)   if File.exists?(dir)
    FileUtils.mkdir_p(dir)
    FileUtils.touch(fixture1)
    FileUtils.touch(fixture2)

    Zip::ZipFile.open(zipfile, Zip::ZipFile::CREATE) do |zipfile|
      zipfile.add(File.basename(fixture1), fixture1)
      zipfile.add(File.basename(fixture2), fixture2)
    end

    zipfile
  end
end #Unp

