// Type definitions for File System Access API

interface FileSystemFileHandle {
  name: string
  kind: 'file'
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | Blob | ArrayBuffer | DataView): Promise<void>
  close(): Promise<void>
}

interface FileSystemHandle {
  name: string
  kind: 'file' | 'directory'
}

interface ShowSaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{
    description: string
    accept: Record<string, string[]>
  }>
}

interface ShowOpenFilePickerOptions {
  types?: Array<{
    description: string
    accept: Record<string, string[]>
  }>
  multiple?: boolean
}

interface Window {
  showSaveFilePicker?(options?: ShowSaveFilePickerOptions): Promise<FileSystemFileHandle>
  showOpenFilePicker?(options?: ShowOpenFilePickerOptions): Promise<FileSystemFileHandle[]>
}
