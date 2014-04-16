require_relative '../../models/synchronization/member'
require_relative '../../models/synchronization/collection'
require_relative '../../../services/datasources/lib/datasources'

class Superadmin::SynchronizationsController < Superadmin::SuperadminController
  include CartoDB

  respond_to :json

  ssl_required :index if Rails.env.production? || Rails.env.staging?

  layout 'application'

  def index
    collection = Synchronization::Collection.new.fetch
    representation = collection.map(&:to_hash)
    response  = {
        synchronizations: representation,
        total_entries:    collection.total_entries
    }
    respond_with(response)
  end #index

end # Superadmin::SynchronizationsController
