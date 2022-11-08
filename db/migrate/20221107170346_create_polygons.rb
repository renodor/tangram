# frozen_string_literal:true

class CreatePolygons < ActiveRecord::Migration[7.0]
  def change
    create_table :polygons do |t|
      t.integer :shape, null: false
      t.float :points, array: true, null: false, default: []

      t.timestamps
    end
  end
end
