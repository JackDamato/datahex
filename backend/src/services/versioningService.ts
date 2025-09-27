import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export interface DatasetVersion {
  id: string;
  projectId: string;
  datasetId: string;
  version: number;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  filePath: string;
  metadata: {
    rows: number;
    columns: number;
    columns_info: Array<{
      name: string;
      type: string;
      null_count: number;
      unique_count: number;
    }>;
    transformations: Array<{
      agent: string;
      action: string;
      timestamp: string;
      parameters: any;
    }>;
    checksum: string;
  };
  tags: string[];
  isActive: boolean;
}

export interface Transformation {
  id: string;
  versionId: string;
  agent: string;
  action: string;
  parameters: any;
  timestamp: string;
  description: string;
  inputChecksum: string;
  outputChecksum: string;
}

export interface VersionHistory {
  versions: DatasetVersion[];
  transformations: Transformation[];
  currentVersion: DatasetVersion | null;
}

export class VersioningService {
  private s3Client: S3Client;
  private bucketName: string;
  private versions: Map<string, DatasetVersion[]> = new Map();
  private transformations: Map<string, Transformation[]> = new Map();

  constructor() {
    // Initialize S3 client for MinIO
    this.s3Client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      region: process.env.MINIO_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });
    
    this.bucketName = process.env.MINIO_BUCKET || 'datahex-datasets';
  }

  /**
   * Create a new dataset version
   */
  async createVersion(
    projectId: string,
    datasetId: string,
    name: string,
    filePath: string,
    metadata: any,
    createdBy: string,
    description?: string,
    tags: string[] = []
  ): Promise<DatasetVersion> {
    const versionId = uuidv4();
    const version = await this.getNextVersionNumber(projectId, datasetId);
    
    // Calculate file checksum
    const fileBuffer = await readFile(filePath);
    const checksum = this.calculateChecksum(fileBuffer);
    
    // Upload file to MinIO
    const s3Key = `projects/${projectId}/datasets/${datasetId}/versions/${version}/${path.basename(filePath)}`;
    await this.uploadToS3(fileBuffer, s3Key);
    
    const datasetVersion: DatasetVersion = {
      id: versionId,
      projectId,
      datasetId,
      version,
      name,
      description,
      createdAt: new Date().toISOString(),
      createdBy,
      filePath: s3Key,
      metadata: {
        ...metadata,
        checksum
      },
      tags,
      isActive: false
    };

    // Store in memory
    const key = `${projectId}-${datasetId}`;
    if (!this.versions.has(key)) {
      this.versions.set(key, []);
    }
    this.versions.get(key)!.push(datasetVersion);

    return datasetVersion;
  }

  /**
   * Record a transformation
   */
  async recordTransformation(
    versionId: string,
    agent: string,
    action: string,
    parameters: any,
    description: string,
    inputChecksum: string,
    outputChecksum: string
  ): Promise<Transformation> {
    const transformationId = uuidv4();
    
    const transformation: Transformation = {
      id: transformationId,
      versionId,
      agent,
      action,
      parameters,
      timestamp: new Date().toISOString(),
      description,
      inputChecksum,
      outputChecksum
    };

    // Store in memory
    if (!this.transformations.has(versionId)) {
      this.transformations.set(versionId, []);
    }
    this.transformations.get(versionId)!.push(transformation);

    return transformation;
  }

  /**
   * Get version history for a dataset
   */
  async getVersionHistory(projectId: string, datasetId: string): Promise<VersionHistory> {
    const key = `${projectId}-${datasetId}`;
    const versions = this.versions.get(key) || [];
    
    const allTransformations: Transformation[] = [];
    for (const version of versions) {
      const versionTransformations = this.transformations.get(version.id) || [];
      allTransformations.push(...versionTransformations);
    }

    const currentVersion = versions.find(v => v.isActive) || versions[0] || null;

    return {
      versions: versions.sort((a, b) => b.version - a.version),
      transformations: allTransformations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      currentVersion
    };
  }

  /**
   * Switch to a specific version
   */
  async switchToVersion(projectId: string, datasetId: string, version: number): Promise<DatasetVersion> {
    const key = `${projectId}-${datasetId}`;
    const versions = this.versions.get(key) || [];
    
    // Deactivate all versions
    versions.forEach(v => v.isActive = false);
    
    // Activate the specified version
    const targetVersion = versions.find(v => v.version === version);
    if (!targetVersion) {
      throw new Error(`Version ${version} not found for dataset ${datasetId}`);
    }
    
    targetVersion.isActive = true;
    return targetVersion;
  }

  /**
   * Get a specific version
   */
  async getVersion(projectId: string, datasetId: string, version: number): Promise<DatasetVersion | null> {
    const key = `${projectId}-${datasetId}`;
    const versions = this.versions.get(key) || [];
    return versions.find(v => v.version === version) || null;
  }

  /**
   * Download version file
   */
  async downloadVersion(versionId: string): Promise<Buffer> {
    // Find the version
    let targetVersion: DatasetVersion | null = null;
    for (const versions of this.versions.values()) {
      const version = versions.find(v => v.id === versionId);
      if (version) {
        targetVersion = version;
        break;
      }
    }

    if (!targetVersion) {
      throw new Error(`Version ${versionId} not found`);
    }

    return await this.downloadFromS3(targetVersion.filePath);
  }

  /**
   * Create a snapshot of current state
   */
  async createSnapshot(versionId: string, snapshotData: any): Promise<string> {
    const snapshotId = uuidv4();
    // In a real implementation, this would be stored in a database
    return snapshotId;
  }

  /**
   * Get snapshot data
   */
  async getSnapshot(snapshotId: string): Promise<any> {
    // In a real implementation, this would retrieve from a database
    return null;
  }

  /**
   * Compare two versions
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<{
    differences: Array<{
      type: 'added' | 'removed' | 'modified';
      field: string;
      oldValue?: any;
      newValue?: any;
    }>;
    summary: {
      rowsAdded: number;
      rowsRemoved: number;
      columnsAdded: number;
      columnsRemoved: number;
      columnsModified: number;
    };
  }> {
    // Find both versions
    let version1: DatasetVersion | null = null;
    let version2: DatasetVersion | null = null;
    
    for (const versions of this.versions.values()) {
      const v1 = versions.find(v => v.id === versionId1);
      const v2 = versions.find(v => v.id === versionId2);
      if (v1) version1 = v1;
      if (v2) version2 = v2;
    }

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    const metadata1 = version1.metadata;
    const metadata2 = version2.metadata;

    const differences = [];
    const summary = {
      rowsAdded: 0,
      rowsRemoved: 0,
      columnsAdded: 0,
      columnsRemoved: 0,
      columnsModified: 0
    };

    // Compare basic metadata
    if (metadata1.rows !== metadata2.rows) {
      const diff = metadata2.rows - metadata1.rows;
      if (diff > 0) {
        summary.rowsAdded = diff;
        differences.push({
          type: 'added' as const,
          field: 'rows',
          oldValue: metadata1.rows,
          newValue: metadata2.rows
        });
      } else {
        summary.rowsRemoved = Math.abs(diff);
        differences.push({
          type: 'removed' as const,
          field: 'rows',
          oldValue: metadata1.rows,
          newValue: metadata2.rows
        });
      }
    }

    if (metadata1.columns !== metadata2.columns) {
      const diff = metadata2.columns - metadata1.columns;
      if (diff > 0) {
        summary.columnsAdded = diff;
        differences.push({
          type: 'added' as const,
          field: 'columns',
          oldValue: metadata1.columns,
          newValue: metadata2.columns
        });
      } else {
        summary.columnsRemoved = Math.abs(diff);
        differences.push({
          type: 'removed' as const,
          field: 'columns',
          oldValue: metadata1.columns,
          newValue: metadata2.columns
        });
      }
    }

    return { differences, summary };
  }

  /**
   * Get transformation timeline
   */
  async getTransformationTimeline(projectId: string, datasetId: string): Promise<Array<{
    version: number;
    transformation: Transformation;
    timestamp: string;
  }>> {
    const key = `${projectId}-${datasetId}`;
    const versions = this.versions.get(key) || [];
    
    const timeline = [];
    for (const version of versions) {
      const versionTransformations = this.transformations.get(version.id) || [];
      for (const transformation of versionTransformations) {
        timeline.push({
          version: version.version,
          transformation,
          timestamp: transformation.timestamp
        });
      }
    }
    
    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Private helper methods
  private async getNextVersionNumber(projectId: string, datasetId: string): Promise<number> {
    const key = `${projectId}-${datasetId}`;
    const versions = this.versions.get(key) || [];
    const maxVersion = versions.reduce((max, v) => Math.max(max, v.version), 0);
    return maxVersion + 1;
  }

  private calculateChecksum(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async uploadToS3(buffer: Buffer, key: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'application/octet-stream'
    });

    await this.s3Client.send(command);
  }

  private async downloadFromS3(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const response = await this.s3Client.send(command);
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}

// Export singleton instance
export const versioningService = new VersioningService();