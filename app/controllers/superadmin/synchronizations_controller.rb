require_relative '../../models/synchronization/member'
require_relative '../../models/synchronization/collection'
require_relative '../../../services/datasources/lib/datasources'

class Superadmin::SynchronizationsController < Superadmin::SuperadminController

  include CartoDB

  respond_to :json

  ssl_required :index

  layout 'application'

  def index
    collection = Synchronization::Collection.new.fetch(per_page: 99_999)
    representation = if params[:pending_syncs].present?
                       collection.map do |sync|
                         sync.should_auto_sync? ? sync.to_hash : nil
                       end.compact
                     else
                       collection.map(&:to_hash)
                     end
    response = {
      synchronizations: representation,
      total_entries: collection.total_entries
    }
    respond_with(response)
  end # index

end # Superadmin::SynchronizationsController
