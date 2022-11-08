# frozen_string_literal:true

class CreatePatterns < ActiveRecord::Migration[7.0]
  def change
    create_table :patterns do |t|
      t.string :name, null: false

      t.timestamps
    end
  end
end
