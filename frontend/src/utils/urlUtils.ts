// URL utility functions

/**
 * Convert a project name to a URL-friendly slug
 * @param name - The project name
 * @returns URL-friendly slug
 */
export const createProjectSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

/**
 * Create a project URL with both ID and name slug
 * @param projectId - The project ID
 * @param projectName - The project name
 * @returns URL hash for the project
 */
export const createProjectUrl = (projectId: string, _projectName: string): string => {
  // For now, just use the project ID directly to simplify routing
  return `#project/${projectId}`;
};

/**
 * Extract project ID from a project URL
 * @param url - The project URL (e.g., "#project/123-my-project")
 * @returns The project ID
 */
export const extractProjectId = (url: string): string => {
  // Simple approach: just remove #project/ prefix
  return url.replace('#project/', '');
};

/**
 * Extract project name slug from a project URL
 * @param url - The project URL (e.g., "#project/123-my-project")
 * @returns The project name slug
 */
export const extractProjectSlug = (url: string): string => {
  const match = url.match(/#project\/[^-]+-(.+)/);
  return match ? match[1] : '';
};
