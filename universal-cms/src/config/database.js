/**
 * Database Connection Manager
 * PostgreSQL connection with pooling and retry logic
 */

const { Pool, QueryResult } = require('pg');
const config = require('../config');

class Database {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection pool
   */
  async connect() {
    if (this.pool) {
      return this.pool;
    }

    const dbConfig = config.database;

    this.pool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.name,
      user: dbConfig.user,
      password: dbConfig.password,
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: dbConfig.pool.idle,
      acquireTimeoutMillis: dbConfig.pool.acquire,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log(`✅ Database connected: ${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`);
      
      // Event listeners
      this.pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        this.isConnected = false;
      });

      return this.pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute a query with parameters
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<QueryResult>}
   */
  async query(text, params = []) {
    if (!this.pool) {
      await this.connect();
    }

    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (config.database.logging && process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', { text, error: error.message });
      throw error;
    }
  }

  /**
   * Execute a transaction
   * @param {Function} callback - Async function receiving client
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    if (!this.pool) {
      await this.connect();
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a client from the pool for manual transaction handling
   * @returns {Promise<Client>}
   */
  async getClient() {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool.connect();
  }

  /**
   * Close all connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('Database connections closed');
    }
  }

  /**
   * Health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as status');
      return result.rows[0].status === 1;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
const db = new Database();

module.exports = db;
