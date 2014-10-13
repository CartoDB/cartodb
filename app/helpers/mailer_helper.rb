# coding: utf-8

module MailerHelper

  def import_finished_title(imported_tables, total_tables, errors)
    if total_tables == 1
      if errors.nil?
        "Your CartoDB table import just finished"
      else
        "There was some error while importing your table"
      end
    else
      if imported_tables == 0
        "There was some error while importing your tables"
      else
        "Your CartoDB tables import just finished"
      end
    end
  end
  
end
