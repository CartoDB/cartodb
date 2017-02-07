# encoding: utf-8
require 'spec_helper_min'
require_relative '../data_import_shared_examples'

describe Carto::DataImport do
  let(:data_import_class) { Carto::DataImport }
  it_behaves_like 'DataImport model'
end
