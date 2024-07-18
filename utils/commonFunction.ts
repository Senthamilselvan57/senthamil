import { Connection, Result, Results, BindParameters } from 'oracledb';
import { connectDb_dev } from '../config/dbConfig';
import { Image } from 'image-js';
0

interface RowData {
  [key: string]: any;
}

export const functionSelect = async (sql: string, bind: any[] = []): Promise<RowData[]> => {
  let connection: Connection | undefined;

  console.log('Executing SQL:', sql, 'with binds:', bind);

  try {
    connection = await connectDb_dev();

    if (!connection) {
      throw new Error('Database connection failed');
    }

    if (!sql || !bind) {
      throw new Error('Invalid SQL or binds');
    }

    const result: Result<any> = await connection.execute(sql, bind);
    const rows = result.rows || [];
    const metaData = result.metaData;

    if (!metaData) {
      throw new Error('Result metaData is undefined');
    }

    const keys = metaData.map((column) => column.name);

    const transformedData: RowData[] = rows.map((row: any[]) => {
      const obj: RowData = {};
      keys.forEach((key: string, index: number) => {
        obj[key] = row[index];
      });
      return obj;
    });

    return transformedData;
  } catch (error: any) {
    if (error.message.includes('ORA-')) {
      throw new Error(`SQL Error: ${error.message}`);
    }
    console.error('Error in functionSelect:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing the database connection:', error);
      }
    }
  }
};

export const functionInsert = async (sql: string, bind: any[] = []): Promise<{ status: boolean, msg: string, RecordsAffected?: number }> => {
  let connection: Connection | undefined;

  try {
    connection = await connectDb_dev();

    if (!connection) {
      throw new Error('Database connection failed');
    }

    if (!sql || !bind) {
      throw new Error("Invalid SQL or binds");
    }

    const result: Result<any> = await connection.execute(sql, bind, { autoCommit: true });
    return {
      status: true,
      msg: "One Row inserted Successfully",
      RecordsAffected: result.rowsAffected,
    };
  } catch (error: any) {
    if (error.message.includes('ORA-')) {
      throw new Error(`SQL Error: ${error.message}`);
    }
    console.error("Error in functionInsert:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Error closing the database connection:", error);
      }
    }
  }
};

export const functionUpdate = async (sql: string, bind: any[] = []): Promise<{ status: boolean; msg: string; RecordsAffected?: number }> => {
  let connection: Connection | undefined;
  console.log(sql, bind);

  try {
    connection = await connectDb_dev();

    if (!connection) {
      throw new Error('Database connection failed');
    }

    if (!sql || !bind) {
      throw new Error("Invalid SQL or binds");
    }

    const result: Result<any> = await connection.execute(sql, bind, { autoCommit: true });
    const rowsAffected = result.rowsAffected || 0;

    return {
      status: true,
      msg: "One row updated successfully",
      RecordsAffected: rowsAffected
    };
  } catch (error: any) {
    if (error.message.includes('ORA-')) {
      throw new Error(`SQL Error: ${error.message}`);
    }
    console.error("Error in functionUpdate:", error);
    throw new Error("Internal server error");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Error closing the database connection:", error);
      }
    }
  }
};

export const functionDelete = async (sql: string, bind: any[] = []): Promise<{ status: boolean; msg: string; RecordsAffected?: number }> => {
  let connection: Connection | undefined;

  try {
    connection = await connectDb_dev();

    if (!connection) {
      throw new Error('Database connection failed');
    }

    if (!sql || !bind) {
      throw new Error("Invalid SQL or binds");
    }

    const result: Result<any> = await connection.execute(sql, bind, { autoCommit: true });
    const rowsAffected = result.rowsAffected || 0;

    return {
      status: true,
      msg: "Record deleted successfully",
      RecordsAffected: rowsAffected
    };
  } catch (error: any) {
    console.error("Error in functionDelete:", error);
    throw new Error("Internal server error");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Error closing the database connection:", error);
      }
    }
  }
};

export const functionInsertMultiple = async (sql: string, bind: any[] = []): Promise<{ status: boolean, msg: string, RecordsAffected?: number }> => {
  let connection: Connection | undefined;

  try {
    connection = await connectDb_dev();

    if (!connection) {
      throw new Error('Database connection failed');
    }

    if (!sql || !bind || bind.length === 0) {
      throw new Error("Invalid SQL or binds");
    }

    const result: Results<any> = await connection.executeMany(sql, bind, { autoCommit: true });
    return {
      status: true,
      msg: "Rows inserted successfully",
      RecordsAffected: result.rowsAffected,
    };
  } catch (error: any) {
    if (error.message.includes('ORA-')) {
      throw new Error(`SQL Error: ${error.message}`);
    }
    console.error("Error in functionInsertMultiple:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Error closing the database connection:", error);
      }
    }
  }
};

export const functionUpdateMultiple = async (sql: string, binds: BindParameters[]): Promise<{ status: boolean, msg: string, RecordsAffected?: number }> => {
  let connection: Connection | undefined;

  try {
    connection = await connectDb_dev();

    if (!connection) {
      throw new Error('Database connection failed');
    }

    try {
      if (sql && binds && binds.length > 0) {
        let result: Results<any>; 

        result = await connection.executeMany(sql, binds, {
          autoCommit: true,
        });

       
        const rowsAffected: number[] = result.rowsAffected ? (Array.isArray(result.rowsAffected) ? result.rowsAffected : [result.rowsAffected]) : [];

       
        const totalRowsAffected = rowsAffected.reduce((total: number, current: number) => total + current, 0);

        return {
          status: true,
          msg: "Rows updated successfully",
          RecordsAffected: totalRowsAffected,
        };
      } else {
        return {
          status: false,
          msg: "Invalid SQL or binds",
        };
      }
    } catch (error) {
      console.error("Error in functionUpdateMultiple:", error);

      throw new Error("Internal server error");
    }
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw new Error("Database connection error");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Error closing the database connection:", error);
      }
    }
  }
};


const convertToJpg = async (bufferData: Buffer): Promise<string> => {
  // Example conversion assuming 'Image' is a custom class or function
  const image = await Image.load(bufferData);
  const jpgBase64Data = image.toBase64('image/jpeg');
  return jpgBase64Data;
};

export const functionSelectImage = async (
  sql: string,
  bind: BindParameters[] = []
): Promise<{ status: 'Success' | 'NoImageFound' | 'DatabaseError', msg: string, imageBase64?: string }> => {
  let connection: Connection | undefined;

  console.log('Executing SQL:', sql, 'with binds:', bind);

  try {
    connection = await connectDb_dev();

    if (!connection) {
      throw new Error('Database connection failed');
    }

    try {
      if (!sql) {
        throw new Error('Invalid SQL query');
      }

      const result: Result<any> = await connection.execute(sql, bind);

      if (!result.rows || result.rows.length === 0) {
        return {
          status: 'NoImageFound',
          msg: 'No image found for the provided query',
        };
      }

      // Assuming the image is in the first row and first column
      const imageBuffer: Buffer = result.rows[0][0];

      // Convert BLOB to Base64 in JPEG format
      const base64Image: string = await convertToJpg(imageBuffer);

      return {
        status: 'Success',
        msg: 'Image retrieved successfully',
        imageBase64: base64Image,
      };
    } catch (error: any) {
      console.error('Error in functionSelectImage:', error.message || error);
      return {
        status: 'DatabaseError',
        msg: 'Error fetching image from database',
      };
    }
  } catch (error: any) {
    console.error('Error connecting to database:', error.message || error);
    return {
      status: 'DatabaseError',
      msg: 'Database connection error',
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error: any) {
        console.error('Error closing the database connection:', error.message || error);
      }
    }
  }
};


module.exports= {
  functionSelect,
  functionInsert,
  functionUpdate,
  functionDelete,
  functionInsertMultiple,
  functionUpdateMultiple,
  functionSelectImage
};
