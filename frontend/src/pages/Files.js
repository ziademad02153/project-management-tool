import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Folder as FolderIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon
} from '@mui/icons-material';
import axios from 'axios';
import Layout from '../components/Layout';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const Files = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('/');
  const [newFolderName, setNewFolderName] = useState('');
  const [openNewFolderDialog, setOpenNewFolderDialog] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [currentFolder]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/files?path=${currentFolder}`, {
        headers: { 'x-auth-token': token }
      });
      setFiles(response.data);
      setLoading(false);
    } catch (error) {
      setError('حدث خطأ في جلب الملفات');
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('path', currentFolder);

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/files/upload', formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('تم رفع الملفات بنجاح');
      setOpenUploadDialog(false);
      setSelectedFiles([]);
      fetchFiles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('حدث خطأ في رفع الملفات');
    }
  };

  const handleCreateFolder = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/files/folder', {
        path: currentFolder,
        name: newFolderName
      }, {
        headers: { 'x-auth-token': token }
      });

      setSuccess('تم إنشاء المجلد بنجاح');
      setOpenNewFolderDialog(false);
      setNewFolderName('');
      fetchFiles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('حدث خطأ في إنشاء المجلد');
    }
  };

  const handleDelete = async (path, isFolder) => {
    if (window.confirm(`هل أنت متأكد من حذف ${isFolder ? 'المجلد' : 'الملف'}؟`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/files?path=${path}`, {
          headers: { 'x-auth-token': token }
        });

        setSuccess(`تم حذف ${isFolder ? 'المجلد' : 'الملف'} بنجاح`);
        fetchFiles();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('حدث خطأ في عملية الحذف');
      }
    }
  };

  const handleDownload = async (path, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/files/download?path=${path}`, {
        headers: { 'x-auth-token': token },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('حدث خطأ في تحميل الملف');
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon />;
      case 'pdf':
        return <PdfIcon />;
      case 'doc':
      case 'docx':
        return <DocIcon />;
      default:
        return <FileIcon />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Layout title="الملفات">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="الملفات">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {currentFolder === '/' ? 'الملفات' : currentFolder}
          </Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setOpenUploadDialog(true)}
              sx={{ mr: 1 }}
            >
              رفع ملفات
            </Button>
            <Button
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={() => setOpenNewFolderDialog(true)}
            >
              مجلد جديد
            </Button>
          </Box>
        </Box>

        {currentFolder !== '/' && (
          <Button
            onClick={() => {
              const parentFolder = currentFolder.split('/').slice(0, -1).join('/') || '/';
              setCurrentFolder(parentFolder);
            }}
            sx={{ mb: 2 }}
          >
            العودة للمجلد السابق
          </Button>
        )}

        <List>
          {files.map((file) => (
            <ListItem
              key={file.path}
              button={file.type === 'folder'}
              onClick={() => file.type === 'folder' && setCurrentFolder(file.path)}
            >
              <ListItemIcon>
                {file.type === 'folder' ? <FolderIcon /> : getFileIcon(file.name)}
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                      {formatDistanceToNow(new Date(file.modifiedAt), {
                        addSuffix: true,
                        locale: ar
                      })}
                    </Typography>
                    {file.type !== 'folder' && (
                      <Chip
                        label={formatFileSize(file.size)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                {file.type !== 'folder' && (
                  <IconButton onClick={() => handleDownload(file.path, file.name)}>
                    <DownloadIcon />
                  </IconButton>
                )}
                <IconButton onClick={() => handleDelete(file.path, file.type === 'folder')}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <DialogTitle>رفع ملفات</DialogTitle>
        <DialogContent>
          <input
            type="file"
            multiple
            onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadIcon />}
              sx={{ mt: 2 }}
            >
              اختر الملفات
            </Button>
          </label>
          {selectedFiles.length > 0 && (
            <List>
              {selectedFiles.map((file, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getFileIcon(file.name)}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={formatFileSize(file.size)}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>إلغاء</Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={selectedFiles.length === 0}
          >
            رفع
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={openNewFolderDialog} onClose={() => setOpenNewFolderDialog(false)}>
        <DialogTitle>إنشاء مجلد جديد</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="اسم المجلد"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewFolderDialog(false)}>إلغاء</Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName}
          >
            إنشاء
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Files;
