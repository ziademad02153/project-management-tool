import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { ar } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import Layout from '../components/Layout';

const locales = {
  'ar': ar
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    type: 'meeting',
    description: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/events', {
        headers: { 'x-auth-token': token }
      });
      setEvents(response.data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      })));
      setLoading(false);
    } catch (error) {
      setError('حدث خطأ في جلب الأحداث');
      setLoading(false);
    }
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setOpenEventDialog(true);
  };

  const handleCreateEvent = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/events', newEvent, {
        headers: { 'x-auth-token': token }
      });
      setSuccess('تم إنشاء الحدث بنجاح');
      setOpenEventDialog(false);
      setNewEvent({
        title: '',
        start: new Date(),
        end: new Date(),
        type: 'meeting',
        description: ''
      });
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('حدث خطأ في إنشاء الحدث');
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحدث؟')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/events/${selectedEvent._id}`, {
          headers: { 'x-auth-token': token }
        });
        setSuccess('تم حذف الحدث بنجاح');
        setOpenEventDialog(false);
        fetchEvents();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('حدث خطأ في حذف الحدث');
      }
    }
  };

  if (loading) {
    return (
      <Layout title="التقويم">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="التقويم">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 2, height: 'calc(100vh - 200px)' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">التقويم</Typography>
          <Button
            variant="contained"
            onClick={() => {
              setSelectedEvent(null);
              setOpenEventDialog(true);
            }}
          >
            إضافة حدث
          </Button>
        </Box>

        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleEventSelect}
          messages={{
            next: "التالي",
            previous: "السابق",
            today: "اليوم",
            month: "شهر",
            week: "أسبوع",
            day: "يوم",
            agenda: "الأجندة",
            date: "التاريخ",
            time: "الوقت",
            event: "الحدث",
            noEventsInRange: "لا توجد أحداث في هذه الفترة"
          }}
        />
      </Paper>

      <Dialog open={openEventDialog} onClose={() => setOpenEventDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEvent ? 'تفاصيل الحدث' : 'إضافة حدث جديد'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="عنوان الحدث"
              value={selectedEvent ? selectedEvent.title : newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              disabled={!!selectedEvent}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="الوصف"
              multiline
              rows={4}
              value={selectedEvent ? selectedEvent.description : newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              disabled={!!selectedEvent}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>نوع الحدث</InputLabel>
              <Select
                value={selectedEvent ? selectedEvent.type : newEvent.type}
                label="نوع الحدث"
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                disabled={!!selectedEvent}
              >
                <MenuItem value="meeting">اجتماع</MenuItem>
                <MenuItem value="deadline">موعد نهائي</MenuItem>
                <MenuItem value="reminder">تذكير</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="تاريخ البداية"
              type="datetime-local"
              value={format(selectedEvent ? new Date(selectedEvent.start) : newEvent.start, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
              disabled={!!selectedEvent}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="تاريخ النهاية"
              type="datetime-local"
              value={format(selectedEvent ? new Date(selectedEvent.end) : newEvent.end, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
              disabled={!!selectedEvent}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {selectedEvent ? (
            <>
              <Button onClick={handleDeleteEvent} color="error">
                حذف
              </Button>
              <Button onClick={() => setOpenEventDialog(false)}>
                إغلاق
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setOpenEventDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateEvent} variant="contained">
                إضافة
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Calendar;
