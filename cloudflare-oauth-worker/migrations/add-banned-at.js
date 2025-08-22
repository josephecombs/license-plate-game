// Migration script to add bannedAt property to existing users
// Run this with: wrangler migration apply

export default {
  async up(env, ctx) {
    console.log('🚀 Starting migration: add-banned-at');
    
    try {
      // Get the game durable object
      const gameObjId = env.GAME.idFromName('game');
      const gameObj = env.GAME.get(gameObjId);
      
      // Fetch current game data
      const gameDataResponse = await gameObj.fetch(new Request('https://get-all-users', {
        method: 'POST',
        body: JSON.stringify({ dummy: 'data' })
      }));
      
      if (!gameDataResponse.ok) {
        throw new Error(`Failed to fetch game data: ${gameDataResponse.status}`);
      }
      
      const users = await gameDataResponse.json();
      console.log(`📊 Found ${users.length} users to migrate`);
      
      // Update each user to add bannedAt property if it doesn't exist
      let updatedCount = 0;
      for (const user of users) {
        if (!user.gameData.bannedAt) {
          // Add bannedAt property with null value (not banned)
          user.gameData.bannedAt = null;
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        // Save the updated game data back to storage
        const updateResponse = await gameObj.fetch(new Request('https://update-all-users', {
          method: 'POST',
          body: JSON.stringify({ users })
        }));
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update game data: ${updateResponse.status}`);
        }
        
        console.log(`✅ Successfully migrated ${updatedCount} users`);
      } else {
        console.log('ℹ️ No users needed migration');
      }
      
      return { success: true, updatedCount };
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(env, ctx) {
    console.log('🔄 Rolling back migration: add-banned-at');
    
    try {
      // Get the game durable object
      const gameObjId = env.GAME.idFromName('game');
      const gameObj = env.GAME.get(gameObjId);
      
      // Fetch current game data
      const gameDataResponse = await gameObj.fetch(new Request('https://get-all-users', {
        method: 'POST',
        body: JSON.stringify({ dummy: 'data' })
      }));
      
      if (!gameDataResponse.ok) {
        throw new Error(`Failed to fetch game data: ${gameDataResponse.status}`);
      }
      
      const users = await gameDataResponse.json();
      console.log(`📊 Found ${users.length} users to rollback`);
      
      // Remove bannedAt property from all users
      let updatedCount = 0;
      for (const user of users) {
        if (user.gameData.bannedAt !== undefined) {
          delete user.gameData.bannedAt;
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        // Save the updated game data back to storage
        const updateResponse = await gameObj.fetch(new Request('https://update-all-users', {
          method: 'POST',
          body: JSON.stringify({ users })
        }));
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update game data: ${updateResponse.status}`);
        }
        
        console.log(`✅ Successfully rolled back ${updatedCount} users`);
      } else {
        console.log('ℹ️ No users needed rollback');
      }
      
      return { success: true, updatedCount };
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}; 