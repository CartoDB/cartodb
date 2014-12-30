require_relative '../../models/synchronization/member'
require_relative '../../models/synchronization/collection'
require_relative '../../../services/datasources/lib/datasources'

class Superadmin::SynchronizationsController < Superadmin::SuperadminController
  include CartoDB

  respond_to :json

  ssl_required :index if Rails.env.production? || Rails.env.staging?

  layout 'application'

  def index
    collection = Synchronization::Collection.new.fetch(per_page:99999)
    if params[:pending_syncs].present?
      representation = collection.map { |sync|
        sync.should_auto_sync? ? sync.to_hash : nil
      }.compact
    else
      representation = collection.map(&:to_hash)
    end
    response = {
        synchronizations: representation,
        total_entries: collection.total_entries
    }
    respond_with(response)
  end #index

end # Superadmin::SynchronizationsController
