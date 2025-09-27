// src/services/dataRepo.ts
import * as sqlite3 from "sqlite3";
import * as path from "path";

export async function getCsvPathForProject(projectId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use the correct database path
    const dbPath = path.join(__dirname, "..", "..", "data", "main.db");
    const db = new sqlite3.Database(dbPath);
    
    db.get(
      "SELECT path FROM files WHERE projectId = ? ORDER BY createdAt DESC LIMIT 1",
      [projectId],
      (err, row: any) => {
        db.close();
        
        if (err) {
          reject(new Error(`Database error: ${err.message}`));
          return;
        }
        
        if (!row?.path) {
          reject(new Error(`No CSV path found for project ${projectId}`));
          return;
        }
        
        // Ensure absolute path
        const absolutePath = row.path.startsWith("/") 
          ? row.path 
          : path.resolve(process.cwd(), row.path);
        
        resolve(absolutePath);
      }
    );
  });
}