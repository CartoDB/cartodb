require 'json'

class ImportMailer < ActionMailer::Base
  default from: Cartodb.get_config(:mailer, 'from')
  layout 'mail'

  def data_import_finished(user, imported_tables, total_tables, first_imported_table, first_table, errors, filenames)
    @errors = errors
    @imported_tables = imported_tables
    @total_tables = total_tables
    @subject = set_subject
    @first_table = first_imported_table.nil? ? first_table : first_imported_table
    @username = user.username
    @files = filenames || []
    @dataset_name = (@first_table && @first_table['name'].present?) ? @first_table['name'] : @files.first
    @link = if first_imported_table.nil?
              "#{user.public_url}#{CartoDB.path(self, 'tables_index')}"
            else
              "#{user.public_url}#{CartoDB.path(self, 'public_tables_show', id: @dataset_name)}"
            end

    mail :to => user.email,
         :subject => @subject
  end

  private

  def set_subject
    if @total_tables == 1
      if @errors.nil?
        subject = "Your dataset import just finished"
      else
        subject = "There was some error while importing your dataset"
      end
    else
      if @imported_tables == 0
        subject = "There was some error while importing your datasets"
      else
        subject = "Your datasets import just finished"
      end
    end

    subject
  end

end
