# Frontend Components

## LiveSummaryStats Component

The `LiveSummaryStats` component now includes a comprehensive file browser section that displays project files in the bottom right of the page.

### Features

- **File Display**: Shows uploaded datasets, models, charts, and folders
- **File Icons**: Different icons for different file types (📊 datasets, 🤖 models, 📈 charts, 📁 folders)
- **File Selection**: Click to select files, double-click to open
- **File Upload**: Drag-and-drop or click to upload new files
- **File Metadata**: Shows file size and modification date
- **Responsive Layout**: Scrollable file list with proper spacing

### File Types Supported

- **Datasets**: `.csv`, `.json`, `.xlsx`, `.xls` files
- **Models**: Machine learning model files (future)
- **Charts**: Generated visualization files (future)
- **Folders**: Organized project structure

### State Management

Uses the `useProjectFiles` hook for:
- File list management
- File selection state
- File upload handling
- File operations (add, remove, update)

### Future Enhancements

- Folder expansion/collapse
- File context menus
- File preview
- File operations (rename, delete, move)
- Real-time file updates
- Integration with backend file storage
