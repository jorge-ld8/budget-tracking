module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
        // Add isDeleted: false to all existing users that don't have this field
        const result = await db.collection('users').updateMany(
          { isDeleted: { $exists: false } },
          { $set: { isDeleted: false } }
        );
        
        console.log(`Migration up: Added isDeleted=false to ${result.modifiedCount} users`);
        
        return result;
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const result = await db.collection('users').updateMany(
      {},
      { $unset: { isDeleted: "" } }
    );
    
    console.log(`Migration down: Removed isDeleted field from ${result.modifiedCount} users`);
    
    return result;
  }
};
