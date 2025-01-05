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
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import Layout from '../components/Layout';

const locales = {
  'en-US': enUS
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
      setError('An error occurred while fetching events');
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
      setSuccess('Event created successfully');
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
      setError('An error occurred while creating the event');
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/events/${selectedEvent._id}`, {
          headers: { 'x-auth-token': token }
        });
        setSuccess('Event deleted successfully');
        setOpenEventDialog(false);
        fetchEvents();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('An error occurred while deleting the event');
      }
    }
  };

  if (loading) {
    return (
      <Layout title="Calendar">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Calendar">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 2, height: 'calc(100vh - 200px)' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Calendar</Typography>
          <Button
            variant="contained"
            onClick={() => {
              setSelectedEvent(null);
              setOpenEventDialog(true);
            }}
          >
            Add Event
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
            next: "Next",
            previous: "Previous",
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            agenda: "Agenda",
            date: "Date",
            time: "Time",
            event: "Event",
            noEventsInRange: "No events in this range"
          }}
        />
      </Paper>

      <Dialog open={openEventDialog} onClose={() => setOpenEventDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEvent ? 'Event Details' : 'Add New Event'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Event Title"
              value={selectedEvent ? selectedEvent.title : newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              disabled={!!selectedEvent}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={selectedEvent ? selectedEvent.description : newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              disabled={!!selectedEvent}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={selectedEvent ? selectedEvent.type : newEvent.type}
                label="Event Type"
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                disabled={!!selectedEvent}
              >
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="deadline">Deadline</MenuItem>
                <MenuItem value="reminder">Reminder</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Start Date"
              type="datetime-local"
              value={format(selectedEvent ? new Date(selectedEvent.start) : newEvent.start, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
              disabled={!!selectedEvent}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Date"
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
                Delete
              </Button>
              <Button onClick={() => setOpenEventDialog(false)}>
                Close
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setOpenEventDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent} variant="contained">
                Add
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Calendar;
