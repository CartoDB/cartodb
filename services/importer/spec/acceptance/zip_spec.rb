# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe 'zip regression tests' do
  before do
    @pg_options  = Factories::PGConnection.new.pg_options
  end

  it 'returns empty results if no supported files in the bundle' do
    filepath    = path_to('one_unsupported.zip')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run

    runner.results.length.must_equal 0
  end

  it 'ignores unsupported files in the bundle' do
    filepath    = path_to('one_unsupported_one_valid.zip')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run

    runner.results.length.must_equal 1
  end

  def path_to(filepath)
    File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
  end #path_to

  def geometry_type_for(runner)
    result      = runner.results.first
    table_name  = result.tables.first
    schema      = result.schema

    runner.db[%Q{
      SELECT public.GeometryType(the_geom)
      FROM "#{schema}"."#{table_name}"
    }].first.fetch(:geometrytype)
  end #geometry_type_for
end # zip regression tests
