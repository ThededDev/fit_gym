import { query } from './_db.js';

export async function GET(request) {
  try {
    const hasDatabase = !!process.env.DATABASE_URL;
    
    // Test database connection
    let dbStatus = 'not_configured';
    let dbError = null;
    
    if (hasDatabase) {
      try {
        const result = await query('SELECT 1 as test');
        dbStatus = 'connected';
      } catch (error) {
        dbStatus = 'error';
        dbError = error.message;
      }
    }
    
    // Check if schema exists
    let schemaStatus = 'not_checked';
    if (dbStatus === 'connected') {
      try {
        const checkResult = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'users'
          );
        `);
        schemaStatus = checkResult.rows[0]?.exists ? 'exists' : 'missing';
      } catch (error) {
        schemaStatus = 'error';
        dbError = error.message;
      }
    }
    
    return Response.json({
      status: 'ok',
      database: {
        configured: hasDatabase,
        connection: dbStatus,
        schema: schemaStatus,
        error: dbError,
        connectionString: hasDatabase ? process.env.DATABASE_URL?.substring(0, 20) + '...' : null
      }
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}