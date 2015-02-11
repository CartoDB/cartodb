# encoding: utf-8
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative '../doubles/user'
require_relative 'acceptance_helpers'

include CartoDB::Importer2

describe 'zip regression tests' do
  include AcceptanceHelpers

  before do
    @pg_options  = Factories::PGConnection.new.pg_options
  end

  it 'returns empty results if no supported files in the bundle' do
    filepath    = path_to('one_unsupported.zip')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    runner.results.length.should eq 0
  end

  it 'ignores unsupported files in the bundle' do
    filepath    = path_to('one_unsupported_one_valid.zip')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    runner.results.length.should eq 1
  end

end