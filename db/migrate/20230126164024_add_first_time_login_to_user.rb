class AddFirstTimeLoginToUser < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :first_time_login, :boolean, default: true
  end
end
