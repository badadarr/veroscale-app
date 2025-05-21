/**
 * This script migrates data from MySQL to Supabase
 * It reads data from your MySQL database and then inserts it into your Supabase database
 */

import { createConnection } from "mysql2/promise";
import { supabase } from "../lib/supabase.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envFile = process.env.NODE_ENV === "production" ? ".env" : ".env.local";
dotenv.config({ path: envFile });

async function migrateData() {
  console.log("Starting data migration from MySQL to Supabase...");

  let mysqlConnection;

  try {
    // Connect to MySQL
    console.log("Connecting to MySQL...");
    mysqlConnection = await createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "admin1234",
      database: process.env.DB_NAME || "weightmanagementdb",
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: true }
        : undefined,
    });

    // Check connection to Supabase
    console.log("Checking Supabase connection...");
    const { data: supabaseTest, error: supabaseError } = await supabase.from("roles").select("count");
    
    if (supabaseError) {
      console.error("Error connecting to Supabase:", supabaseError);
      return;
    }
    
    console.log("Connected to both databases. Starting migration...");
    
    // Migrate roles
    console.log("Migrating roles...");
    const [roles] = await mysqlConnection.execute("SELECT * FROM roles");
    
    if (roles.length > 0) {
      const { error: rolesError } = await supabase.from("roles").upsert(
        roles.map(role => ({ id: role.id, name: role.name })),
        { onConflict: 'id' }
      );
      
      if (rolesError) {
        console.error("Error migrating roles:", rolesError);
      } else {
        console.log(`Migrated ${roles.length} roles successfully`);
      }
    }
    
    // Migrate users
    console.log("Migrating users...");
    const [users] = await mysqlConnection.execute("SELECT * FROM users");
    
    if (users.length > 0) {
      const { error: usersError } = await supabase.from("users").upsert(
        users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password, // Already hashed in the MySQL DB
          role_id: user.role_id,
          created_at: user.created_at,
          updated_at: user.updated_at
        })),
        { onConflict: 'id' }
      );
      
      if (usersError) {
        console.error("Error migrating users:", usersError);
      } else {
        console.log(`Migrated ${users.length} users successfully`);
      }
    }
    
    // Migrate ref_items
    console.log("Migrating ref_items...");
    const [refItems] = await mysqlConnection.execute("SELECT * FROM ref_items");
    
    if (refItems.length > 0) {
      const { error: refItemsError } = await supabase.from("ref_items").upsert(
        refItems.map(item => ({
          id: item.id,
          name: item.name,
          weight: parseFloat(item.weight)
        })),
        { onConflict: 'id' }
      );
      
      if (refItemsError) {
        console.error("Error migrating ref_items:", refItemsError);
      } else {
        console.log(`Migrated ${refItems.length} ref_items successfully`);
      }
    }
    
    // Migrate samples_item
    console.log("Migrating samples_item...");
    const [samplesItems] = await mysqlConnection.execute("SELECT * FROM samples_item");
    
    if (samplesItems.length > 0) {
      const { error: samplesItemsError } = await supabase.from("samples_item").upsert(
        samplesItems.map(item => ({
          id: item.id,
          category: item.category,
          item: item.item,
          sample_weight: parseFloat(item.sample_weight),
          created_at: item.created_at,
          updated_at: item.updated_at
        })),
        { onConflict: 'id' }
      );
      
      if (samplesItemsError) {
        console.error("Error migrating samples_item:", samplesItemsError);
      } else {
        console.log(`Migrated ${samplesItems.length} samples_item successfully`);
      }
    }
    
    // Migrate weight_records
    console.log("Migrating weight_records...");
    const [weightRecords] = await mysqlConnection.execute("SELECT * FROM weight_records");
    
    if (weightRecords.length > 0) {
      const { error: weightRecordsError } = await supabase.from("weight_records").upsert(
        weightRecords.map(record => ({
          record_id: record.record_id,
          user_id: record.user_id,
          item_id: record.item_id,
          total_weight: parseFloat(record.total_weight),
          timestamp: record.timestamp,
          status: record.status
        })),
        { onConflict: 'record_id' }
      );
      
      if (weightRecordsError) {
        console.error("Error migrating weight_records:", weightRecordsError);
      } else {
        console.log(`Migrated ${weightRecords.length} weight_records successfully`);
      }
    }
    
    // Migrate sessions
    console.log("Migrating sessions...");
    const [sessions] = await mysqlConnection.execute("SELECT * FROM sessions");
    
    if (sessions.length > 0) {
      const { error: sessionsError } = await supabase.from("sessions").upsert(
        sessions.map(session => ({
          session_id: session.session_id,
          user_id: session.user_id,
          start_time: session.start_time,
          end_time: session.end_time,
          status: session.status
        })),
        { onConflict: 'session_id' }
      );
      
      if (sessionsError) {
        console.error("Error migrating sessions:", sessionsError);
      } else {
        console.log(`Migrated ${sessions.length} sessions successfully`);
      }
    }
    
    console.log("Data migration completed successfully!");
    
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log("MySQL connection closed");
    }
  }
}

// Run the migration
migrateData();
