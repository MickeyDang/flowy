#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

function updateEnvFile(apiKey) {
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }
    
    // Update or add FLOWY_API_KEY
    const lines = envContent.split('\n');
    let keyUpdated = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('FLOWY_API_KEY=')) {
        lines[i] = `FLOWY_API_KEY=${apiKey}`;
        keyUpdated = true;
        break;
      }
    }
    
    // If key wasn't found, add it
    if (!keyUpdated) {
      lines.push(`FLOWY_API_KEY=${apiKey}`);
    }
    
    // Write back to file
    fs.writeFileSync(envPath, lines.join('\n'));
    
    return true;
  } catch (error) {
    console.error('Error updating .env file:', error.message);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const shouldUpdateEnv = args.includes('--update-env') || args.includes('-u');
  
  console.log('🔑 Generating new API key...\n');
  
  // Generate new API key
  const apiKey = generateApiKey();
  
  console.log('Generated API Key:');
  console.log(`${apiKey}\n`);
  
  // Update .env file if requested
  if (shouldUpdateEnv) {
    console.log('Updating .env file...');
    
    if (updateEnvFile(apiKey)) {
      console.log('✅ .env file updated successfully');
      console.log('🔄 Restart your servers to use the new API key');
    } else {
      console.log('❌ Failed to update .env file');
      console.log('📝 Please manually update FLOWY_API_KEY in your .env file');
    }
  } else {
    console.log('💡 To automatically update .env file, use: npm run keygen -- --update-env');
    console.log('📝 Or manually update FLOWY_API_KEY in your .env file');
  }
  
  console.log('\n🛡️  Security Notes:');
  console.log('- Keep this API key secure and don\'t share it');
  console.log('- Add .env to .gitignore to prevent accidental commits');
  console.log('- Regenerate periodically for better security');
}

if (require.main === module) {
  main();
}

module.exports = { generateApiKey, updateEnvFile };