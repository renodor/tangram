class AddOrderToPatterns < ActiveRecord::Migration[7.0]
  def change
    add_column :patterns, :order, :integer
  end
end
