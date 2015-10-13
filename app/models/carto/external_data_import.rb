# encoding: utf-8

require 'active_record'

module Carto
  class ExternalDataImport < ActiveRecord::Base

    belongs_to :data_import, class_name: Carto::DataImport
    belongs_to :external_source, class_name: Carto::ExternalSource
    belongs_to :synchronization, class_name: Carto::Synchronization

  end
end
