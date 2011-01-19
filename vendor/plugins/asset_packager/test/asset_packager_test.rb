require File.dirname(__FILE__) + '/../../../../config/environment'
require 'test/unit'
require 'mocha'

class AssetPackagerTest < Test::Unit::TestCase
  include Synthesis
  
  def setup
    Synthesis::AssetPackage.asset_base_path    = "#{Rails.root}/vendor/plugins/asset_packager/test/assets"
    Synthesis::AssetPackage.asset_packages_yml = YAML.load_file("#{Rails.root}/vendor/plugins/asset_packager/test/asset_packages.yml")

    Synthesis::AssetPackage.any_instance.stubs(:log)
    Synthesis::AssetPackage.build_all
  end
  
  def teardown
    Synthesis::AssetPackage.delete_all
  end
  
  def test_find_by_type
    js_asset_packages = Synthesis::AssetPackage.find_by_type("javascripts")
    assert_equal 2, js_asset_packages.length
    assert_equal "base", js_asset_packages[0].target
    assert_equal ["prototype", "effects", "controls", "dragdrop"], js_asset_packages[0].sources
  end
  
  def test_find_by_target
    package = Synthesis::AssetPackage.find_by_target("javascripts", "base")
    assert_equal "base", package.target
    assert_equal ["prototype", "effects", "controls", "dragdrop"], package.sources
  end
  
  def test_find_by_source
    package = Synthesis::AssetPackage.find_by_source("javascripts", "controls")
    assert_equal "base", package.target
    assert_equal ["prototype", "effects", "controls", "dragdrop"], package.sources
  end
  
  def test_delete_and_build
    Synthesis::AssetPackage.delete_all
    js_package_names = Dir.new("#{Synthesis::AssetPackage.asset_base_path}/javascripts").entries.delete_if { |x| ! (x =~ /\A\w+_packaged.js/) }
    css_package_names = Dir.new("#{Synthesis::AssetPackage.asset_base_path}/stylesheets").entries.delete_if { |x| ! (x =~ /\A\w+_packaged.css/) }
    css_subdir_package_names = Dir.new("#{Synthesis::AssetPackage.asset_base_path}/stylesheets/subdir").entries.delete_if { |x| ! (x =~ /\A\w+_packaged.css/) }
    
    assert_equal 0, js_package_names.length
    assert_equal 0, css_package_names.length
    assert_equal 0, css_subdir_package_names.length

    Synthesis::AssetPackage.build_all
    js_package_names = Dir.new("#{Synthesis::AssetPackage.asset_base_path}/javascripts").entries.delete_if { |x| ! (x =~ /\A\w+_packaged.js/) }.sort
    css_package_names = Dir.new("#{Synthesis::AssetPackage.asset_base_path}/stylesheets").entries.delete_if { |x| ! (x =~ /\A\w+_packaged.css/) }.sort
    css_subdir_package_names = Dir.new("#{Synthesis::AssetPackage.asset_base_path}/stylesheets/subdir").entries.delete_if { |x| ! (x =~ /\A\w+_packaged.css/) }.sort
    
    assert_equal 2, js_package_names.length
    assert_equal 2, css_package_names.length
    assert_equal 1, css_subdir_package_names.length
    assert js_package_names[0].match(/\Abase_packaged.js\z/)
    assert js_package_names[1].match(/\Asecondary_packaged.js\z/)
    assert css_package_names[0].match(/\Abase_packaged.css\z/)
    assert css_package_names[1].match(/\Asecondary_packaged.css\z/)
    assert css_subdir_package_names[0].match(/\Astyles_packaged.css\z/)
  end
  
  def test_js_names_from_sources
    package_names = Synthesis::AssetPackage.targets_from_sources("javascripts", ["prototype", "effects", "noexist1", "controls", "foo", "noexist2"])
    assert_equal 4, package_names.length
    assert package_names[0].match(/\Abase_packaged\z/)
    assert_equal package_names[1], "noexist1"
    assert package_names[2].match(/\Asecondary_packaged\z/)
    assert_equal package_names[3], "noexist2"
  end
  
  def test_css_names_from_sources
    package_names = Synthesis::AssetPackage.targets_from_sources("stylesheets", ["header", "screen", "noexist1", "foo", "noexist2"])
    assert_equal 4, package_names.length
    assert package_names[0].match(/\Abase_packaged\z/)
    assert_equal package_names[1], "noexist1"
    assert package_names[2].match(/\Asecondary_packaged\z/)
    assert_equal package_names[3], "noexist2"
  end
  
  def test_should_return_merge_environments_when_set
    Synthesis::AssetPackage.merge_environments = ["staging", "production"]
    assert_equal ["staging", "production"], Synthesis::AssetPackage.merge_environments
  end

  def test_should_only_return_production_merge_environment_when_not_set
    assert_equal ["production"], Synthesis::AssetPackage.merge_environments
  end
  
end
