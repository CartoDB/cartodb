# encoding: utf-8
require_relative '../acceptance_helper'

feature 'Dashboard' do
  background do
    @user = FactoryGirl.create(:user, :table_quota => 6)
    @tables = []
    @tables << FactoryGirl.create(:table, :user_id => @user.id, :tags => 'tag 1, wadus')
    @tables << FactoryGirl.create(:table, :user_id => @user.id, :tags => 'wadus')
    @tables << FactoryGirl.create(:table, :user_id => @user.id, :tags => 'tag 2')
    @tables << FactoryGirl.create(:table, :user_id => @user.id, :tags => 'tag 1, tag 2')
    @tables << FactoryGirl.create(:table, :user_id => @user.id, :tags => 'tag 2, wadus')
  end

  scenario 'allows user to login and see their tables' do
    log_in_as(@user)

    page.should have_content "Welcome #{@user.username}"
    page.should have_content '5 tables in your account'
    page.should have_css 'div.table_info div.left hgroup h3 a', :length => 5
  end

  scenario 'allows users to browse their tables by tags' do
    log_in_as(@user)

    page.should have_content '5 tables in your account'

    click_on 'wadus'

    page.should have_content '3 tables with tag wadus'

    page.should have_link @tables[0].name
    page.should have_link @tables[1].name
    page.should have_link @tables[4].name

    page.should_not have_link @tables[2].name
    page.should_not have_link @tables[3].name

    click_on 'tag 1'

    page.should have_content '2 tables with tag tag 1'

    page.should have_link @tables[0].name
    page.should have_link @tables[3].name

    page.should_not have_link @tables[1].name
    page.should_not have_link @tables[2].name
    page.should_not have_link @tables[4].name
  end

  scenario 'allows users to remove a table' do
    log_in_as(@user)

    page.should have_content '5 tables in your account'

    within '.table_info' do
      click_on 'delete'
    end

    expect do
      click_on 'Delete this table'
    end.to change{ Table.count }.from(5).to(4)

    page.should have_content '4 tables in your account'
  end

  scenario 'allows users to create a table with default attributes' do
    log_in_as(@user)

    click_on 'Create a new table'

    click_on 'Start from scratch'

    expect do
      click_on 'Create table'
      sleep 3
    end.to change{ Table.count }.from(5).to(6)

    created_table = Table.all.last

    page.should have_link created_table.name

    current_path.should match table_path(created_table)
  end

  scenario 'shows users a link to upgrade their accounts' do
    log_in_as(@user)

    page.should have_content "Hey #{@user.username}, looks like you're about to reach your account limit. Start thinking about upgrading your plan."

    page.should have_link 'upgrading your plan', :href => "http://localhost:3000/account/#{@user.username}/upgrade"
  end

  scenario 'allows users to obtain their security keys' do
    log_in_as(@user)

    click_on @user.username

    click_on 'Your API keys'

    page.should have_content 'Your Api key'

    click_on 'Request a new key'

    click_on 'Regenerate Api key'

    page.should have_content @user.api_key

    click_on 'OAUTH'

    click_on 'Request a new key'

    click_on 'Regenerate Oauth and secret keys'

    page.should have_content @user.client_application.key
    page.should have_content @user.client_application.secret

  end

  scenario 'allows users to create a table from a imported file'

  scenario 'allows users to create a table from a URL pointing to a data file'

  scenario 'allows to import a previously exported table as SHP (.zip extension)'

  scenario 'allows to import a previously exported table as SHP (.tgz extension)'

  scenario 'allows to import a previously exported table as SHP (.tar.gz extension)'

  scenario 'allows to import a previously exported table as CSV'

  scenario 'allows to import a previously exported table as KML'

  scenario 'allows to import a previously exported table as SQL'
end

