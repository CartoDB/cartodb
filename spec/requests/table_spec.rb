# encoding: utf-8
require_relative '../acceptance_helper'

feature 'Table' do
  background do
    @user = FactoryGirl.create(:user)
    @table = FactoryGirl.create(:table, :user_id => @user.id, :tags => 'tag 1, wadus')
  end

  scenario 'allow users to create a new column' do
    log_in_as(@user)

    click_on @table.name

    find('.add_column').click

    page.should have_content 'Add new column'

    find('input.column_name').set 'wadus'

    expect do
      click_on 'Create column'
    end.to change{ @table.schema.length }.from(6).to(7)

    within 'div.table table thead tr th:eq(6)' do
      page.should have_css 'div div label.strong', :text => 'wadus'
      page.should have_css 'div div p.small', :text => 'string'
    end
  end

  scenario 'allow users to delete a existing column' do
    log_in_as(@user)

    click_on @table.name

    click_on 'name'

    expect do
      click_on 'Delete this column'
    end.to change{ @table.schema.length }.from(6).to(5)

    page.should have_content 'Your column has been deleted'

    page.should_not have_css 'div.table table thead tr th div div label.strong', :text => 'name'
  end

  scenario 'allow users to change the type of a column' do
    log_in_as(@user)

    click_on @table.name


    within 'div.table table thead tr th:eq(5)' do
      click_on 'name'

      click_on 'Change data type...'

      click_on 'number'

    end

    click_on 'Yes, do it'

    page.should have_content 'Column type has been changed'

    @table.schema.should include([:name, "number"])
    @table.schema.should_not include([:name, "string"])

    within 'div.table table thead tr th:eq(5)' do
      click_on 'number'
    end

    click_on 'number'

    click_on 'Yes, do it'

    page.should have_content 'Column type has been changed'

    @table.schema.should_not include([:name, "number"])
    @table.schema.should include([:name, "string"])
  end

  scenario 'allow users to change the type of a column to a destructive type (from string to number)'
  scenario 'allow users to change the name of a column'
  scenario 'allow users to create a new row and fill some columns'
  scenario 'allow users to delete a row'
  scenario 'allow users to export its data to SHP format'
  scenario 'allow users to export its data to CSV format'
  scenario 'allow users to export its data to KML format'
  scenario 'allow users to export its data to SQL format'
  scenario 'allow users to edit a cell'
  scenario 'allow users to perform a query and paginate the results several times (up and down)'
  scenario 'allow users to create table from a query'
  scenario 'allow users to duplicate a table'
  scenario 'allow users to mark a table as public / private'
  scenario 'allow users to open your public URL in a different window'
  scenario 'allow users to tag a table'
  scenario 'allow users to add a description to a table'
  scenario 'allow users to rename a table'
  scenario 'allow users to paginate its rows several times (up & down)'

end
