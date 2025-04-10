// migrations/20230615000003-set-admin-user.js
module.exports = {
  async up(db) {
    // Find the user with username 'admin' and set isAdmin to true
    const result = await db.collection('users').updateOne(
      { username: 'admin' },
      { $set: { isAdmin: true } }
    );
    
    console.log(`Updated ${result.modifiedCount} user(s) to admin status`);
    
    // If no user was found/updated, you might want to log a warning
    if (result.modifiedCount === 0) {
      console.warn('No user with username "admin" was found. No admin was created.');
    }
    
    return result;
  },

  async down(db) {
    // Revert the change - set isAdmin back to false for the admin user
    const result = await db.collection('users').updateOne(
      { username: 'admin' },
      { $set: { isAdmin: false } }
    );
    
    console.log(`Reverted admin status for ${result.modifiedCount} user(s)`);
    return result;
  }
};