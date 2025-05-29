// This script will apply the database implementation fixes
// It copies the fixed API files to their correct locations

const fs = require('fs');
const path = require('path');

// Path configurations
const projectRoot = __dirname;
const fixedFilesMap = [
  {
    source: path.join(projectRoot, 'pages/api/weights/fixed-multi-material.ts'),
    destination: path.join(projectRoot, 'pages/api/weights/multi-material.ts')
  },
  {
    source: path.join(projectRoot, 'pages/api/issues/fixed-[id].ts'),
    destination: path.join(projectRoot, 'pages/api/issues/[id].ts')
  },
  {
    source: path.join(projectRoot, 'pages/api/issues/fixed-index.ts'),
    destination: path.join(projectRoot, 'pages/api/issues/index.ts')
  }
];

// Create backup function
function createBackup(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup at: ${backupPath}`);
    return backupPath;
  }
  return null;
}

// Apply fixes
function applyFixes() {
  console.log('Starting database implementation fixes...');
  
  let success = true;
  const backups = [];
  
  fixedFilesMap.forEach(({ source, destination }) => {
    try {
      if (!fs.existsSync(source)) {
        console.error(`Source file not found: ${source}`);
        success = false;
        return;
      }
      
      const backupPath = createBackup(destination);
      if (backupPath) backups.push({ original: destination, backup: backupPath });
      
      fs.copyFileSync(source, destination);
      console.log(`Successfully replaced: ${destination}`);
    } catch (error) {
      console.error(`Error replacing ${destination}:`, error);
      success = false;
    }
  });
  
  if (success) {
    console.log('\nAll database implementation fixes applied successfully!');
    console.log('The API endpoints now use Supabase instead of MySQL.');
  } else {
    console.log('\nSome fixes failed to apply. Check the errors above.');
    console.log('You may need to manually copy the fixed files.');
    
    if (backups.length > 0) {
      console.log('\nBackups were created for the following files:');
      backups.forEach(({ original, backup }) => {
        console.log(`- ${original} -> ${backup}`);
      });
      console.log('You can restore these backups if needed.');
    }
  }
}

// Run the fix application
applyFixes();
