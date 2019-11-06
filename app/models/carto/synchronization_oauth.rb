require 'active_record'

module Carto
  class SynchronizationOauth < ActiveRecord::Base

    belongs_to :user, class_name: 'Carto::User', inverse_of: :synchronization_oauths

    # TODO: partial duplication with DataImportsService (this one hasn't redis_storage)
    def get_service_datasource
      datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(service, user, {
        http_timeout: ::DataImport.http_timeout_for(user)
      })
      datasource.token = token unless datasource.nil?
      datasource
    end

  end
end
