module Carto
  module Superadmin
    class UserMigrationImportsController < ::Superadmin::SuperadminController
      respond_to :json

      ssl_required :show, :create

      def create
        import = Carto::UserMigrationImport.create(
          exported_file:   params[:exported_file],
          json_file:       params[:json_file],
          database_host:   params[:database_host],
          org_import:      params[:org_import],
          user_id:         params[:user_id],
          organization_id: params[:organization_id],
          import_metadata: params[:import_metadata] == 'true',
          dry:             false,
          import_data:     params[:import_data] != 'false'
        )
        if import.save
          import.enqueue
          render json: UserMigrationImportPresenter.new(import).to_poro, status: 201
        else
          render json: { errors: import.errors.to_h }, status: 422
        end
      end

      def show
        import = Carto::UserMigrationImport.find(params[:id])
        render json: UserMigrationImportPresenter.new(import).to_poro
      end
    end
  end
end
