module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    // Add isAdmin field to all users that don't have it
    await db.collection('users').updateMany(
      { isAdmin: { $exists: false } },
      { $set: { isAdmin: false } }
    );
    
    // Optionally set a specific user as admin
    // await db.collection('users').updateOne(
    //   { email: 'admin@example.com' },
    //   { $set: { isAdmin: true } }
    // );
    
    console.log('Added isAdmin field to users');
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db) {
    // Remove isAdmin field from all users
    await db.collection('users').updateMany(
      {},
      { $unset: { isAdmin: "" } }
    );
    
    console.log('Removed isAdmin field from users');
  }
};
