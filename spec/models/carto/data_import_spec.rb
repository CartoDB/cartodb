require 'spec_helper_unit'
require_relative '../data_import_shared_examples'

describe Carto::DataImport do
  let(:data_import_class) { Carto::DataImport }
  it_behaves_like 'DataImport model'
end
