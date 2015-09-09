class ImportMailer < ActionMailer::Base
  default from: "cartodb.com <support@cartodb.com>"
  layout 'mail'

  def data_import_finished(user, imported_tables, total_tables, first_imported_table, first_table, errors)
    @errors = errors
    @imported_tables = imported_tables
    @total_tables = total_tables
    @subject = set_subject
    @first_table = first_imported_table.nil? ? first_table : first_imported_table
    @link = first_imported_table.nil? ? "#{user.public_url}#{CartoDB.path(self, 'tables_index')}" : "#{user.public_url}#{CartoDB.path(self, 'public_tables_show', { id: @first_table['name'] })}"

    mail :to => user.email,
         :subject => @subject
  end

  private

  def set_subject
    if @total_tables == 1
      if @errors.nil?
        subject = "Your CartoDB dataset import just finished"
      else
        subject = "There was some error while importing your dataset"
      end
    else
      if @imported_tables == 0
        subject = "There was some error while importing your datasets"
      else
        subject = "Your CartoDB datasets import just finished"
      end
    end

    subject
  end

end
