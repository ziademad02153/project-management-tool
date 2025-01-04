import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Badge,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import axios from 'axios';
import Layout from '../components/Layout';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect to socket server
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('message', handleNewMessage);
    newSocket.on('typing', handleTyping);
    setSocket(newSocket);

    // Fetch conversations
    fetchConversations();

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/chat/conversations', {
        headers: { 'x-auth-token': token }
      });
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      setError('حدث خطأ في جلب المحادثات');
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/chat/messages/${conversationId}`, {
        headers: { 'x-auth-token': token }
      });
      setMessages(response.data);
    } catch (error) {
      setError('حدث خطأ في جلب الرسائل');
    }
  };

  const handleNewMessage = (message) => {
    if (message.conversation === selectedConversation?._id) {
      setMessages(prev => [...prev, message]);
    }
    // Update conversation list
    setConversations(prev => {
      const updated = [...prev];
      const index = updated.findIndex(c => c._id === message.conversation);
      if (index !== -1) {
        updated[index].lastMessage = message;
        // Move to top
        const [conv] = updated.splice(index, 1);
        updated.unshift(conv);
      }
      return updated;
    });
  };

  const handleTyping = ({ user, conversation }) => {
    if (conversation === selectedConversation?._id) {
      // Show typing indicator
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/chat/messages', {
        conversation: selectedConversation._id,
        content: newMessage,
        type: 'text'
      }, {
        headers: { 'x-auth-token': token }
      });

      socket.emit('message', response.data);
      setNewMessage('');
    } catch (error) {
      setError('حدث خطأ في إرسال الرسالة');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversation', selectedConversation._id);

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/chat/upload', formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      socket.emit('message', response.data);
    } catch (error) {
      setError('حدث خطأ في رفع الملف');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEmojiClick = (event, emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  if (loading) {
    return (
      <Layout title="المحادثات">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="المحادثات">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', overflow: 'auto' }}>
            <List>
              {conversations.map((conversation) => (
                <React.Fragment key={conversation._id}>
                  <ListItem
                    button
                    selected={selectedConversation?._id === conversation._id}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="success"
                        variant="dot"
                        invisible={!conversation.isOnline}
                      >
                        <Avatar src={conversation.avatar} />
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={conversation.name}
                      secondary={
                        conversation.lastMessage?.content ||
                        'ابدأ محادثة جديدة'
                      }
                      secondaryTypographyProps={{
                        noWrap: true,
                        sx: { maxWidth: '200px' }
                      }}
                    />
                    {conversation.unreadCount > 0 && (
                      <Chip
                        label={conversation.unreadCount}
                        color="primary"
                        size="small"
                      />
                    )}
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Grid container alignItems="center">
                    <Grid item xs>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Badge
                          color="success"
                          variant="dot"
                          invisible={!selectedConversation.isOnline}
                        >
                          <Avatar
                            src={selectedConversation.avatar}
                            sx={{ mr: 1 }}
                          />
                        </Badge>
                        <Box>
                          <Typography variant="subtitle1">
                            {selectedConversation.name}
                          </Typography>
                          {selectedConversation.isOnline ? (
                            <Typography variant="caption" color="success.main">
                              متصل الآن
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(
                                new Date(selectedConversation.lastSeen),
                                { addSuffix: true, locale: ar }
                              )}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item>
                      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>

                {/* Messages Area */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                  {messages.map((message, index) => (
                    <Box
                      key={message._id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.sender === 'me' ? 'flex-end' : 'flex-start',
                        mb: 2
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '70%',
                          backgroundColor: message.sender === 'me' ? 'primary.main' : 'grey.100',
                          color: message.sender === 'me' ? 'white' : 'text.primary',
                          borderRadius: 2,
                          p: 2
                        }}
                      >
                        {message.type === 'text' ? (
                          <Typography>{message.content}</Typography>
                        ) : message.type === 'image' ? (
                          <img
                            src={message.content}
                            alt="Shared"
                            style={{ maxWidth: '100%', borderRadius: 8 }}
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachFileIcon sx={{ mr: 1 }} />
                            <Typography>{message.fileName}</Typography>
                          </Box>
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            textAlign: message.sender === 'me' ? 'right' : 'left',
                            mt: 0.5
                          }}
                        >
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                            locale: ar
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
                  <Grid container spacing={2}>
                    <Grid item>
                      <input
                        type="file"
                        id="chat-file"
                        hidden
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="chat-file">
                        <IconButton component="span">
                          <AttachFileIcon />
                        </IconButton>
                      </label>
                    </Grid>
                    <Grid item>
                      <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                        <EmojiIcon />
                      </IconButton>
                    </Grid>
                    <Grid item xs>
                      <TextField
                        fullWidth
                        placeholder="اكتب رسالة..."
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          socket.emit('typing', {
                            conversation: selectedConversation._id
                          });
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage();
                          }
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <SendIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography color="text.secondary">
                  اختر محادثة للبدء
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <Box sx={{ position: 'absolute', bottom: 100, right: 100 }}>
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          // Handle clear chat
          setAnchorEl(null);
        }}>
          مسح المحادثة
        </MenuItem>
        <MenuItem onClick={() => {
          // Handle block user
          setAnchorEl(null);
        }}>
          حظر المستخدم
        </MenuItem>
      </Menu>
    </Layout>
  );
};

export default Chat;
