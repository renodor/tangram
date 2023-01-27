# frozen_string_literal:true

class CreateSolutions < ActiveRecord::Migration[7.0]
  def change
    create_table :solutions do |t|
      t.references :pattern, foreign_key: true, null: false

      t.timestamps
    end
  end
end
