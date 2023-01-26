# frozen_string_literal:true

class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  # :recoverable, :rememberable
  devise :database_authenticatable, :registerable, :validatable

  has_many :solved_patterns
  has_many :patterns, through: :solved_patterns

  def self.demo_user
    User.find_by(email: Rails.application.credentials.demo_user_email)
  end
end
