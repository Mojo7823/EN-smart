# Knowledge Base Features

## Overview
The chatbot now includes a comprehensive knowledge base system that allows users to upload and manage PDF files for persistent context across chat sessions.

## Key Features

### 1. Persistent File Storage
- Files uploaded through the chat are automatically stored in the knowledge base
- Files persist across browser sessions using localStorage
- Files are available for context in all future chat conversations

### 2. Knowledge Base Interface
- **Dashboard Integration**: Knowledge base component is integrated into the main dashboard
- **File Management**: View, download, and delete uploaded files
- **Drag & Drop**: Support for drag and drop file uploads
- **File Statistics**: Display file count, total size, and last updated information

### 3. Chat Integration
- **Context Awareness**: The AI assistant is aware of all uploaded files
- **File Display**: Knowledge base files are displayed as clickable chips in the chat interface
- **File Viewing**: Click on any file chip to view the PDF in a modal dialog
- **File Deletion**: Delete files directly from the chat interface

### 4. File Management
- **Upload Validation**: Only PDF files up to 32MB are accepted
- **Usage Tracking**: Files track usage count and last used date
- **Smart Context**: Files used recently or frequently are prioritized for context
- **Cascading Deletion**: When a file is deleted, all chat messages referencing it are also removed

### 5. User Experience
- **Page Unload Prevention**: Users are warned when leaving the page with uploaded files
- **Visual Feedback**: Success/error messages for all file operations
- **Responsive Design**: Interface works on desktop and mobile devices

## Technical Implementation

### Services
- **KnowledgeBaseService**: Manages file storage, retrieval, and statistics
- **LLMSettingsService**: Enhanced to include knowledge base context in AI conversations

### Components
- **KnowledgeBaseComponent**: Main knowledge base management interface
- **ChatComponent**: Enhanced with knowledge base integration
- **PdfViewerDialog**: Modal dialog for viewing PDF files

### Data Flow
1. User uploads file through chat or knowledge base interface
2. File is stored in knowledge base with metadata
3. File is available for context in all future AI conversations
4. AI assistant receives context about available files
5. Users can view, download, or delete files as needed

## Usage Instructions

### Uploading Files
1. **Via Chat**: Click the attachment button in the chat interface
2. **Via Knowledge Base**: Use the upload area in the knowledge base section
3. **Drag & Drop**: Drag PDF files directly onto the upload area

### Managing Files
1. **View Files**: Click on any file chip to open the PDF viewer
2. **Delete Files**: Click the delete button on any file chip
3. **Download Files**: Use the download button in the PDF viewer

### File Context
- Files are automatically included in AI conversations
- The AI assistant is aware of all uploaded files
- Files used recently are prioritized for context

## Security & Privacy
- Files are stored locally in the browser's localStorage
- No files are sent to external servers (except for AI processing)
- Files are automatically cleaned up when the user leaves the page
- Users are warned about file deletion on page unload

## Limitations
- Maximum file size: 32MB
- Supported format: PDF only
- Storage is limited by browser localStorage capacity
- Files are stored locally and not synced across devices