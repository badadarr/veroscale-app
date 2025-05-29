/**
 * Script to help migrate API routes from MySQL to Supabase
 * 
 * This script helps:
 * 1. Replace imports from @/lib/db to @/lib/db-adapter
 * 2. Remove MySQL-specific code and keep only Supabase code
 * 3. Remove conditional checks for useSupabase
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Path to API routes
const API_PATH = path.join(__dirname, '../pages/api');

// Function to recursively process all API files
function processApiFiles() {
  // Find all TypeScript files in the API directory
  const files = glob.sync(`${API_PATH}/**/*.ts`);
  
  console.log(`Found ${files.length} API files to check`);
  
  let migratedCount = 0;
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let changed = false;
    
    // 1. Replace imports from @/lib/db to @/lib/db-adapter
    if (content.includes('import { executeQuery } from "@/lib/db"') || 
        content.includes("import { executeQuery } from '@/lib/db'")) {
      content = content.replace(
        /import \{ executeQuery \} from ['"]@\/lib\/db['"]/g,
        'import { executeQuery } from "@/lib/db-adapter"'
      );
      changed = true;
      console.log(`Updated import in ${path.basename(file)}`);
    }
    
    // 2. Remove useSupabase conditional checks
    if (content.includes('const useSupabase = Boolean(')) {
      // First find all useSupabase blocks
      const blocks = findUseSupabaseBlocks(content);
      
      blocks.forEach(block => {
        const { start, end, supabaseCode } = block;
        // Only keep the Supabase part
        if (supabaseCode) {
          const newContent = content.substring(0, start) + 
                            supabaseCode + 
                            content.substring(end);
          content = newContent;
          changed = true;
        }
      });
      
      // Remove the useSupabase declaration
      content = content.replace(
        /\s*const useSupabase = Boolean\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL &&\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY\s*\);\s*/g,
        '\n'
      );
      
      console.log(`Removed useSupabase conditionals in ${path.basename(file)}`);
    }
    
    // 3. Replace "public.table_name" with just "table_name"
    if (content.includes('table: "public.')) {
      content = content.replace(/table: "public\.([^"]+)"/g, 'table: "$1"');
      changed = true;
      console.log(`Simplified table names in ${path.basename(file)}`);
    }
    
    // 4. Replace record_id with id in filters
    if (content.includes('filters: { record_id:')) {
      content = content.replace(/filters: \{ record_id:/g, 'filters: { id:');
      changed = true;
      console.log(`Fixed record_id references in ${path.basename(file)}`);
    }
    
    // 5. Remove raw SQL queries
    if (content.includes('query: "SELECT') || content.includes("query: `SELECT")) {
      console.log(`WARNING: File ${path.basename(file)} contains raw SQL queries that need manual migration`);
    }
    
    // Save changes if needed
    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      migratedCount++;
    }
  });
  
  console.log(`Migration complete. Updated ${migratedCount} files.`);
  console.log('Please manually check files that had raw SQL queries.');
}

// Helper function to find Supabase/MySQL conditional blocks
function findUseSupabaseBlocks(content) {
  const blocks = [];
  let searchIndex = 0;
  
  while (true) {
    // Find if (useSupabase) { ... } else { ... }
    const ifIndex = content.indexOf('if (useSupabase)', searchIndex);
    if (ifIndex === -1) break;
    
    // Find the opening brace
    const openBraceIndex = content.indexOf('{', ifIndex);
    if (openBraceIndex === -1) break;
    
    // Find the matching closing brace by counting braces
    let braceCount = 1;
    let closeBraceIndex = openBraceIndex + 1;
    
    while (braceCount > 0 && closeBraceIndex < content.length) {
      if (content[closeBraceIndex] === '{') braceCount++;
      if (content[closeBraceIndex] === '}') braceCount--;
      closeBraceIndex++;
    }
    
    // Find the else part if it exists
    const elseIndex = content.indexOf('else', closeBraceIndex);
    if (elseIndex !== -1 && content.substring(closeBraceIndex, elseIndex).trim() === '') {
      // There is an else block, find its opening and closing braces
      const elseOpenBraceIndex = content.indexOf('{', elseIndex);
      
      if (elseOpenBraceIndex !== -1) {
        let elseBraceCount = 1;
        let elseCloseBraceIndex = elseOpenBraceIndex + 1;
        
        while (elseBraceCount > 0 && elseCloseBraceIndex < content.length) {
          if (content[elseCloseBraceIndex] === '{') elseBraceCount++;
          if (content[elseCloseBraceIndex] === '}') elseBraceCount--;
          elseCloseBraceIndex++;
        }
        
        // Extract Supabase code (between if opening and closing)
        const supabaseCode = content.substring(openBraceIndex + 1, closeBraceIndex - 1).trim();
        
        blocks.push({
          start: ifIndex,
          end: elseCloseBraceIndex,
          supabaseCode
        });
      }
    } else {
      // No else part, just extract the if part
      const supabaseCode = content.substring(openBraceIndex + 1, closeBraceIndex - 1).trim();
      
      blocks.push({
        start: ifIndex,
        end: closeBraceIndex,
        supabaseCode
      });
    }
    
    // Move search index forward
    searchIndex = closeBraceIndex;
  }
  
  return blocks;
}

// Run the script
processApiFiles();
