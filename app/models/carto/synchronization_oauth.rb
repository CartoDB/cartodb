# encoding: utf-8

require 'active_record'

module Carto
  class SynchronizationOauth < ActiveRecord::Base

    belongs_to :user

    def get_service_datasource
      datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(service, user, {
        http_timeout: ::DataImport.http_timeout_for(user)
      })
      datasource.token = token unless datasource.nil?
      datasource
    end

  end
end
