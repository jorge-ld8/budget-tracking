module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Create a unique index on accounts collection for name field, scoped to user
    // This ensures each user can't have multiple accounts with the same name
    await db.collection('accounts').createIndex(
      { name: 1, user: 1 },
      { unique: true, background: true }
    );
    
    // Create a unique index on categories collection for name field, scoped to user and type
    // This ensures each user can't have multiple categories with the same name within the same type
    await db.collection('categories').createIndex(
      { name: 1, user: 1, type: 1 },
      { unique: true, background: true }
    );
    
    console.log('Added unique constraints to accounts and categories');
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Drop the unique indexes to roll back the changes
    await db.collection('accounts').dropIndex('name_1_user_1');
    await db.collection('categories').dropIndex('name_1_user_1_type_1');
    
    console.log('Removed unique constraints from accounts and categories');
  }
};
