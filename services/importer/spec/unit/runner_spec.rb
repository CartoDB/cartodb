# encoding: utf-8
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../doubles/importer_stats'
require_relative '../doubles/loader'
require_relative '../doubles/log'
require_relative '../doubles/indexer'
require_relative '../factories/pg_connection'
require_relative '../doubles/downloader'
require_relative '../doubles/loader'
require_relative '../doubles/user'
require_relative '../doubles/input_file_size_limit'
require_relative '../doubles/table_row_count_limit'

describe CartoDB::Importer2::Runner do
  before(:all) do
    @filepath       = '/var/tmp/foo.txt'
    @filepath = File.open(@filepath, 'w+')
    @filepath.write('...')
    @filepath.close
    @user = create_user
    @user.save
    @pg_options = @user.db_service.db_configuration_for

    @fake_log = CartoDB::Importer2::Doubles::Log.new(@user)
    @downloader = CartoDB::Importer2::Downloader.new(@filepath)
    @fake_multiple_downloader_2 = CartoDB::Importer2::Doubles::MultipleDownloaderFake.instance(2)
  end

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
  end

  describe '#initialize' do
    it 'requires postgres options and a downloader object' do
      expect {
        CartoDB::Importer2::Runner.new({ log: @fake_log })
      }.to raise_error KeyError
      expect {
        CartoDB::Importer2::Runner.new({ log: @fake_log, pg: nil })
      }.to raise_error KeyError
    end
  end

  describe '#run' do
    it 'calls import for each file to process' do
      source_file = CartoDB::Importer2::SourceFile.new(@filepath)

      fake_loader = self.fake_loader_for(nil, source_file)
      def fake_loader.run(args); end

      runner = CartoDB::Importer2::Runner.new({
                            pg: @pg_options,
                            downloader: @downloader,
                            log: @fake_log,
                            user: @user,
                            unpacker: fake_loader
                          })

      runner.stubs(:import)

      runner.expects(:import).once

      runner.run
    end

    it 'logs the file path to be imported' do
      runner = CartoDB::Importer2::Runner.new({
                           pg: @pg_options,
                           downloader: @downloader,
                           log: @fake_log,
                           user: @user,
                           unpacker: fake_unpacker
                         })
      runner.run
      (runner.report =~ /#{@filepath.path}/).should_not eq nil
    end
  end

  describe '#tracker' do
    it 'returns the block passed at initialization' do
      data_import = OpenStruct.new
      runner = CartoDB::Importer2::Runner.new({
                            pg: @pg_options,
                            downloader: @downloader,
                            log: @fake_log,
                            user: @user,
                            unpacker: fake_unpacker
                          })

      def runner.import(*args); end

      runner.run { |state| data_import.state = 'bogus_state' }
      data_import.state.should eq 'bogus_state'
    end
  end

  describe '#import' do
    it 'creates a sucessful result if all import steps completed' do
      source_file = CartoDB::Importer2::SourceFile.new(@filepath)

      job = CartoDB::Importer2::Job.new({ pg_options: @pg_options, logger: @fake_log })
      def job.success_status; true; end

      runner = CartoDB::Importer2::Runner.new({
                            pg: @pg_options,
                            downloader: Object.new,
                            log: @fake_log,
                            user: @user,
                            job: job
                          })
      fake_loader = self.fake_loader_for(job, source_file)
      def fake_loader.run; end

      runner.send(:import, source_file, nil, fake_loader)
      result = runner.results.first
      result.success?.should eq true
    end

    it 'creates a failed result if an exception raised during import' do
      source_file = CartoDB::Importer2::SourceFile.new(@filepath)
      job         = CartoDB::Importer2::Job.new({ pg_options: @pg_options, logger: @fake_log })

      runner      = CartoDB::Importer2::Runner.new({
                                 pg: @pg_options,
                                 downloader: Object.new,
                                 log: @fake_log,
                                 user: @user,
                                 job: job
                               })

      fake_loader = self.fake_loader_for(job, source_file)
      def fake_loader.run; raise 'Unleash the Kraken!!!!'; end

      runner.send(:import, source_file, nil, fake_loader)
      result = runner.results.first
      result.success?.should eq false
    end

    it 'checks the platform limits regarding file size' do
      source_file = CartoDB::Importer2::SourceFile.new(@filepath)

      job         = CartoDB::Importer2::Job.new({
                                                  pg_options: @pg_options,
                                                  logger: @fake_log
                                                })

      fake_loader = self.fake_loader_for(job, source_file)
      def fake_loader.run(arg=nil); end

      # File is 5 bytes long, should allow
      input_file_size_limit_checker = CartoDB::Importer2::Doubles::InputFileSizeLimit.new({max_size:5})
      table_row_count_limit_checker = CartoDB::Importer2::Doubles::TableRowCountLimit.new
      runner      = CartoDB::Importer2::Runner.new({
                                                     pg: @pg_options,
                                                     downloader: Object.new,
                                                     log: @fake_log,
                                                     user: @user,
                                                     limits: {
                                                       import_file_size_instance: input_file_size_limit_checker,
                                                       table_row_count_limit_instance: table_row_count_limit_checker
                                                     },
                                                     job: job
                                                   })

      runner.send(:import, source_file, nil, fake_loader)
      result = runner.results.first
      result.success?.should eq true

      # File is 3 bytes long, should fail
      input_file_size_limit_checker = CartoDB::Importer2::Doubles::InputFileSizeLimit.new({max_size:2})
      runner      = CartoDB::Importer2::Runner.new({
                                                     pg: @pg_options,
                                                     downloader: Object.new,
                                                     log: @fake_log,
                                                     user: @user,
                                                     limits: {
                                                       import_file_size_instance: input_file_size_limit_checker,
                                                       table_row_count_limit_instance: table_row_count_limit_checker
                                                     },
                                                     job: job
                                                   })

      runner.send(:import, source_file, nil, fake_loader)
      result = runner.results.first
      result.success?.should eq false
      result.error_code.should eq 6666 # @see services/importer/lib/importer/exceptions.rb -> FileTooBigError

      # Shouldn't test here a zipped file as that
    end
  end


  describe 'stats logger' do

    before(:each) do
      @importer_stats_spy = CartoDB::Doubles::Stats::Importer.instance
    end

    it 'logs total import time' do
      runner = CartoDB::Importer2::Runner.new({
                             pg: @pg_options,
                             downloader: @downloader,
                             log: @fake_log,
                             user: @user,
                             unpacker: fake_unpacker
                          })

      spy_runner_importer_stats(runner, @importer_stats_spy)
      runner.run
      @importer_stats_spy.timed_block_suffix_count('run').should eq 1
    end

    it 'does not fail if loader does not support logging' do
      table_row_count_limit_checker = CartoDB::Importer2::Doubles::TableRowCountLimit.new

      source_file = CartoDB::Importer2::SourceFile.new(@filepath)
      job         = CartoDB::Importer2::Job.new({ pg_options: @pg_options, logger: @fake_log })

      runner      = CartoDB::Importer2::Runner.new({
                                 pg: @pg_options,
                                 downloader: Object.new,
                                 log: @fake_log,
                                 user: @user,
                                 job: job,
                                 limits: {
                                   table_row_count_limit_instance: table_row_count_limit_checker
                                 }
                               })
      spy_runner_importer_stats(runner, @importer_stats_spy)

      fake_loader = CartoDB::Importer2::Doubles::Loader.new
      runner.send(:import, source_file, nil, fake_loader)
      runner.results.first.success?.should == true
    end

    it 'logs single resource import flow time' do
      runner = CartoDB::Importer2::Runner.new({
                            pg: @pg_options,
                            downloader: @downloader,
                            log: @fake_log,
                            user: @user,
                            unpacker: fake_unpacker
                          })

      spy_runner_importer_stats(runner, @importer_stats_spy)
      runner.run
      @importer_stats_spy.timed_block_suffix_count('run.resource').should eq 1
      @importer_stats_spy.timed_block_suffix_count('run.resource.download').should eq 1
      # Checked upon actual import, not "run", so not called
      @importer_stats_spy.timed_block_suffix_count('run.resource.quota_check').should eq 0
      @importer_stats_spy.timed_block_suffix_count('run.resource.unpack').should eq 1
      @importer_stats_spy.timed_block_suffix_count('run.resource.import').should eq 1
      @importer_stats_spy.timed_block_suffix_count('run.resource.cleanup').should eq 1
    end

    it 'logs multiple subresource import times' do
      runner = CartoDB::Importer2::Runner.new({
                            pg: @pg_options,
                            downloader: @fake_multiple_downloader_2,
                            log: @fake_log,
                            user: CartoDB::Importer2::Doubles::User.new
                          })
      spy_runner_importer_stats(runner, @importer_stats_spy)
      runner.run
      @importer_stats_spy.timed_block_suffix_count('run.subresource').should eq 2
    end

    it 'logs multiple subresource import flow times' do
      runner = CartoDB::Importer2::Runner.new({
                            pg: @pg_options,
                            downloader: @fake_multiple_downloader_2,
                            log: @fake_log,
                            user: CartoDB::Importer2::Doubles::User.new
                          })
      spy_runner_importer_stats(runner, @importer_stats_spy)
      runner.run
      @importer_stats_spy.timed_block_suffix_count('run.subresource.datasource_metadata').should eq 2
      @importer_stats_spy.timed_block_suffix_count('run.subresource.download').should eq 2
      @importer_stats_spy.timed_block_suffix_count('run.subresource.quota_check').should eq 2
      @importer_stats_spy.timed_block_suffix_count('run.subresource.import').should eq 2
      @importer_stats_spy.timed_block_suffix_count('run.subresource.cleanup').should eq 2
    end
  end

  def spy_runner_importer_stats(runner, importer_stats_spy)
    runner.instance_eval {
      @importer_stats = importer_stats_spy
    }
  end

  def fake_loader_for(job, source_file)
    OpenStruct.new(
      job:                job,
      source_file:        source_file,
      source_files:       [source_file],
      valid_table_names:  []
    )
  end

  def fake_unpacker
    Class.new {
      def initialize
        @sourcefile = CartoDB::Importer2::SourceFile.new('/var/tmp/foo.txt')
      end
      def run(*args)
      end

      def source_files
        [@sourcefile]
      end

      def clean_up
      end
    }.new
  end

end

