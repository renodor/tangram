# frozen_string_literal:true

class AddPunToPatterns < ActiveRecord::Migration[7.0]
  def change
    add_column :patterns, :pun, :text
  end
end
