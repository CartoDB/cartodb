# encoding: utf-8
require_relative '../../lib/importer/ogr2ogr_params_helper'

# These tests are a bit dummy, but they use ogrinfo underneath and take care
# of stability of the options fed to ogr2ogr. They are expected to change with
# new versions of ogr2ogr/ogrinfo, for efficiency and fitness of the process.
describe CartoDB::Importer2::Ogr2ogrParamsHelper do
  describe '#guessing_args' do
    it 'returns AUTODETECT_TYPE option' do
      helper_factory('all.csv').guessing_args.should include("-oo AUTODETECT_TYPE=YES")
    end
    it 'returns the QUOTED_FIELDS_AS_STRING=[NO|YES] depending on the input in the constructor' do
      # Inverse of the selection: if I want guessing I must NOT leave quoted fields as string
      helper_factory('all.csv', true).guessing_args.should include("-oo QUOTED_FIELDS_AS_STRING=NO")
      helper_factory('all.csv', false).guessing_args.should include("-oo QUOTED_FIELDS_AS_STRING=YES")
    end
    it 'adds the option KEEP_GEOM_COLUMNS=YES' do
      # INFO: until we have a more recent ogrinfo2.1 with autodetect and guessing enabled
      # this will be the expected behavior. Also, in order to take full advantage, we need to get some
      # bugs fixed in gdal
      helper_factory('all.csv').guessing_args.should include("-oo KEEP_GEOM_COLUMNS=YES")
      helper_factory('forest_change.csv').guessing_args.should include("-oo KEEP_GEOM_COLUMNS=YES")
      helper_factory('ne_10m_populated_places_simple.csv').guessing_args.should include("-oo KEEP_GEOM_COLUMNS=YES")
    end
  end

  def helper_factory(filename, quoted_fields_guessing=false)
    CartoDB::Importer2::Ogr2ogrParamsHelper.new(path_to(filename), quoted_fields_guessing, _layer=nil)
  end

  def path_to(filename)
    File.join(File.dirname(__FILE__), '..', 'fixtures', filename)
  end

end
