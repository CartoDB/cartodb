require 'spec_helper'

describe SqlParser do

  before(:each) do
    @parser = SqlParser.new
  end

  def parse(input)
    unless result = @parser.parse(input)
      nil
    else
      result
    end
  end

  describe "parsing" do
    it "when conditions are not joined with an :and or :or, does not succeed" do
      @parser.parse("select first_name from users where first_name='joe' last_name='bob'").should be_nil
    end
  end

  describe "#tree when parsing select statement" do
    it "parses a multi field, table, and where clause statement" do
      @parser.parse("select distinct *, first_name, last_name, middle_name from users, accounts, logins where first_name='joe' and last_name='bob' or age > 25 limit 10").tree.should == {
        :operator => :select,
        :set_quantifier => :distinct,
        :fields => [:'*', :first_name, :last_name, :middle_name],
        :tables => [:users, :accounts, :logins],
        :conditions => [
          {:operator => :'=', :field => :first_name, :value => 'joe'},
          {:operator => :and},
          {:operator => :'=', :field => :last_name, :value => 'bob'},
          {:operator => :or},
          {:operator => :'>', :field => :age, :value => 25}
        ],
        :limit => 10
      }
    end
  end

  describe "#operator when parsing select statement" do
    it "returns :select" do
      @parser.parse("select first_name").operator.should == :select
    end
  end

  describe "#set_quantifier when parsing select statement" do
    it "when parsing distinct, returns :distinct" do
      @parser.parse("select distinct first_name").set_quantifier.should == :distinct
    end

    it "when parsing all, returns :all" do
      @parser.parse("select all first_name").set_quantifier.should == :all
    end
  end

  describe "#fields when parsing select statement" do
    it "returns the fields in the statement" do
      @parser.parse("select first_name").fields.should == [:first_name]
      @parser.parse("select first_name, last_name, middle_name").fields.should == [
        :first_name, :last_name, :middle_name
      ]
    end

    it "when receiving *, returns * in the fields list" do
      @parser.parse("select *").fields.should == [:'*']
    end
  end

  describe "#tables when parsing select statement" do
    it "returns tables from the statement" do
      @parser.parse("select first_name from users").tables.should == [:users]
      @parser.parse("select first_name from users, accounts, logins").tables.should == [
        :users, :accounts, :logins
      ]
    end
    it "should recognize quotes" do
      @parser.parse('select first_name from "users"').tables.should == [:users]
    end
  end

  describe "#conditions when parsing select statement" do
    it "when no where conditions, returns empty hash" do
      @parser.parse("select first_name from users").conditions.should == []
    end

    it "returns equality conditions from the statement" do
      @parser.parse("select first_name from users where id=3").conditions.should == [
        { :operator => :'=', :field => :id, :value => 3 }
      ]
      @parser.parse("select first_name from users where first_name='joe'").conditions.should == [
        { :operator => :'=', :field => :first_name, :value => 'joe' }
      ]
      @parser.parse("select first_name from users where first_name='joe' and last_name='bob'").conditions.should == [
        {:operator => :'=', :field => :first_name, :value => 'joe'},
        {:operator => :and},
        {:operator => :'=', :field => :last_name, :value => 'bob'}
      ]
    end

    it "returns greater than conditions from the statement" do
      @parser.parse("select first_name from users where id>3").conditions.should == [
        { :operator => :'>', :field => :id, :value => 3 }
      ]

      @parser.parse("select first_name from users where id>3 and age>25").conditions.should == [
        {:operator => :'>', :field => :id, :value => 3},
        {:operator => :and},
        {:operator => :'>', :field => :age, :value => 25}
      ]
    end

    it "returns less than conditions from the statement" do
      @parser.parse("select first_name from users where id<3").conditions.should == [
        { :operator => :'<', :field => :id, :value => 3 }
      ]

      @parser.parse("select first_name from users where id<3 and age<25").conditions.should == [
        {:operator => :'<', :field => :id, :value => 3},
        {:operator => :and},
        {:operator => :'<', :field => :age, :value => 25}
      ]
    end

    it "returns greater than or equal to conditions from the statement" do
      @parser.parse("select first_name from users where id>=3").conditions.should == [
        { :operator => :'>=', :field => :id, :value => 3 }
      ]

      @parser.parse("select first_name from users where id>=3 and age>=25").conditions.should == [
        {:operator => :'>=', :field => :id, :value => 3},
        {:operator => :and},
        {:operator => :'>=', :field => :age, :value => 25}
      ]
    end

    it "returns less than or equal to conditions from the statement" do
      @parser.parse("select first_name from users where id<=3").conditions.should == [
        { :operator => :'<=', :field => :id, :value => 3 }
      ]

      @parser.parse("select first_name from users where id<=3 and age<=25").conditions.should == [
        {:operator => :'<=', :field => :id, :value => 3},
        {:operator => :and},
        {:operator => :'<=', :field => :age, :value => 25}
      ]
    end

    it "returns not equal to conditions from the statement" do
      @parser.parse("select first_name from users where id<>3").conditions.should == [
        { :operator => :'<>', :field => :id, :value => 3 }
      ]

      @parser.parse("select first_name from users where id<>3 and age<>25").conditions.should == [
        {:operator => :'<>', :field => :id, :value => 3},
        {:operator => :and},
        {:operator => :'<>', :field => :age, :value => 25}
      ]
    end
  end

  describe "#conditions when parsing select statement with :and operators" do
    it "returns single level :and operation" do
      @parser.parse("select first_name from users where first_name='joe' and last_name='bob'").conditions.should == [
        {:operator => :'=', :field => :first_name, :value => 'joe'},
        {:operator => :and},
        {:operator => :'=', :field => :last_name, :value => 'bob'}
      ]
    end

    it "returns nested :and operations from the statement" do
      @parser.parse("select first_name from users where first_name='joe' and last_name='bob' and middle_name='pat'").conditions.should == [
        {:operator => :'=', :field => :first_name, :value => 'joe'},
        {:operator => :and},
        {:operator => :'=', :field => :last_name, :value => 'bob'},
        {:operator => :and},
        {:operator => :'=', :field => :middle_name, :value => 'pat'}
      ]
    end
  end

  describe "#conditions when parsing select statement with :or operators" do
    it "returns single level :and operation" do
      @parser.parse("select first_name from users where first_name='joe' or last_name='bob'").conditions.should == [
        {:operator => :'=', :field => :first_name, :value => 'joe'},
        {:operator => :or},
        {:operator => :'=', :field => :last_name, :value => 'bob'}
      ]
    end

    it "returns nested :or operations from the statement" do
      @parser.parse("select first_name from users where first_name='joe' or last_name='bob' or middle_name='pat'").conditions.should == [
        {:operator => :'=', :field => :first_name, :value => 'joe'},
        {:operator => :or},
        {:operator => :'=', :field => :last_name, :value => 'bob'},
        {:operator => :or},
        {:operator => :'=', :field => :middle_name, :value => 'pat'}
      ]
    end
  end

  describe "#conditions when parsing select statement with :and and :or operators" do
    it "returns :and having precedence over :or" do
      @parser.parse("select first_name from users where age > 25 and first_name='joe' or last_name='bob'").conditions.should == [
        {:operator => :'>', :field => :age, :value => 25},
        {:operator => :and},
        {:operator => :'=', :field => :first_name, :value => 'joe'},
        {:operator => :or},
        {:operator => :'=', :field => :last_name, :value => 'bob'}
      ]
    end
  end
end
