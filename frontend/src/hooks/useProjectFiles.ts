import { useState, useCallback } from 'react'

export interface ProjectFile {
  id: string
  name: string
  type: 'dataset' | 'model' | 'chart' | 'folder'
  size?: string
  modified: string
  path: string
  children?: ProjectFile[]
}

export const useProjectFiles = () => {
  const [files, setFiles] = useState<ProjectFile[]>([
    {
      id: '1',
      name: 'sales_data.csv',
      type: 'dataset',
      size: '2.4 MB',
      modified: '2024-01-15 14:30',
      path: '/datasets/sales_data.csv'
    },
    {
      id: '2',
      name: 'models',
      type: 'folder',
      modified: '2024-01-15 16:45',
      path: '/models',
      children: []
    },
    {
      id: '3',
      name: 'charts',
      type: 'folder',
      modified: '2024-01-15 16:45',
      path: '/charts',
      children: []
    }
  ])

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  const addFile = useCallback((file: ProjectFile) => {
    setFiles(prev => [...prev, file])
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  const updateFile = useCallback((fileId: string, updates: Partial<ProjectFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, ...updates } : file
    ))
  }, [])

  const getFileById = useCallback((fileId: string) => {
    return files.find(file => file.id === fileId)
  }, [files])

  const getFilesByType = useCallback((type: ProjectFile['type']) => {
    return files.filter(file => file.type === type)
  }, [files])

  const uploadFiles = useCallback(async (fileList: FileList) => {
    const newFiles: ProjectFile[] = []
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const fileType = file.name.endsWith('.csv') ? 'dataset' : 
                      file.name.endsWith('.json') ? 'dataset' :
                      file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'dataset' : 'dataset'
      
      newFiles.push({
        id: `file_${Date.now()}_${i}`,
        name: file.name,
        type: fileType,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        modified: new Date().toLocaleString(),
        path: `/datasets/${file.name}`
      })
    }
    
    setFiles(prev => [...prev, ...newFiles])
    return newFiles
  }, [])

  return {
    files,
    selectedFileId,
    setSelectedFileId,
    addFile,
    removeFile,
    updateFile,
    getFileById,
    getFilesByType,
    uploadFiles
  }
}
