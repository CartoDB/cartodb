class ImportMailer < UserMailer

  def data_import_finished(user, imported_tables, total_tables, first_imported_table, first_table, errors)
    @imported_tables = imported_tables
    @total_tables = total_tables
    @first_table = first_imported_table.nil? ? first_table : first_imported_table
    organization = user.organization
    subdomain = organization.nil? ? user.username : organization.name
    user_name = organization.nil? ? nil : user.username
    @link = first_imported_table.nil? ? "#{user.public_url}#{tables_index_path}" : "#{CartoDB.base_url(subdomain, user_name)}#{public_tables_show_path(id:@first_table['name'])}"
    @errors = errors
    mail :to => user.email,
         :subject => set_subject
  end

  private

    def set_subject
      if @total_tables == 1
        if @errors.nil?
          subject = "Your CartoDB table import just finished"
        else
          subject = "There was some error while importing your table"
        end
      else
        if @imported_tables == 0
          subject = "There was some error while importing your tables"
        else
          subject = "Your CartoDB tables import just finished"
        end
      end

      subject
    end

end
