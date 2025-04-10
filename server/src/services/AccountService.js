const Account = require('../models/accounts');

class AccountService {
  async findAll() {
    return Account.find({});
  }

  async findById(id) {
    return Account.findById(id);
  }

  async create(accountData) {
    const account = new Account(accountData);
    return account.save();
  }

  async update(id, accountData) {
    return Account.findByIdAndUpdate(id, accountData, { new: true });
  }

  async delete(id) {
    return Account.findByIdAndDelete(id);
  }

  async findByUser(userId) {
    return Account.find({ user: userId });
  }

  async updateBalance(id, amount, operation = 'add') {
    const account = await Account.findById(id);
    if (!account) return null;

    if (operation === 'add') {
      account.balance += amount;
    } else if (operation === 'subtract') {
      if (account.balance < amount) {
        throw new Error('Insufficient funds');
      }
      account.balance -= amount;
    }

    return account.save();
  }

  async toggleActive(id) {
    const account = await Account.findById(id);
    if (!account) return null;

    account.isActive = !account.isActive;
    return account.save();
  }
}

module.exports = AccountService; 