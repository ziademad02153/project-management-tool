const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { user: req.user.id },
        { 'attendees.user': req.user.id }
      ]
    }).populate('user', 'username').populate('attendees.user', 'username');
    res.json(events);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Create new event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, start, end, type, attendees, project, team } = req.body;

    const event = new Event({
      title,
      description,
      start,
      end,
      type,
      user: req.user.id,
      project,
      team,
      attendees: attendees?.map(userId => ({ user: userId })) || []
    });

    await event.save();

    // Create notifications for attendees
    if (attendees && attendees.length > 0) {
      const notifications = attendees.map(userId => ({
        user: userId,
        title: 'دعوة لحدث جديد',
        message: `تمت دعوتك لحضور: ${title}`,
        type: 'event',
        reference: event._id
      }));

      await Notification.insertMany(notifications);
    }

    res.json(event);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, start, end, type } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    if (event.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    event.title = title;
    event.description = description;
    event.start = start;
    event.end = end;
    event.type = type;

    await event.save();

    // Create notification for attendees
    const notifications = event.attendees.map(attendee => ({
      user: attendee.user,
      title: 'تحديث في الحدث',
      message: `تم تحديث تفاصيل الحدث: ${title}`,
      type: 'event',
      reference: event._id
    }));

    await Notification.insertMany(notifications);

    res.json(event);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    if (event.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Create notification for attendees
    const notifications = event.attendees.map(attendee => ({
      user: attendee.user,
      title: 'إلغاء حدث',
      message: `تم إلغاء الحدث: ${event.title}`,
      type: 'event',
      reference: event._id
    }));

    await Notification.insertMany(notifications);

    await event.remove();

    res.json({ msg: 'Event removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Update attendance status
router.put('/:id/attend', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    const attendeeIndex = event.attendees.findIndex(
      a => a.user.toString() === req.user.id
    );

    if (attendeeIndex === -1) {
      return res.status(404).json({ msg: 'User not invited to this event' });
    }

    event.attendees[attendeeIndex].status = status;
    await event.save();

    // Create notification for event creator
    const notification = new Notification({
      user: event.user,
      title: 'رد على دعوة',
      message: `${req.user.username} ${status === 'accepted' ? 'قبل' : 'رفض'} دعوة الحدث: ${event.title}`,
      type: 'event',
      reference: event._id
    });

    await notification.save();

    res.json(event);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
