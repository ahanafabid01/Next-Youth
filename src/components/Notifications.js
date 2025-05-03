import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAsRead } from '../api/notifications';
import NotificationItem from './NotificationItem';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await getNotifications();
      setNotifications(data);
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
      </ul>
    </div>
  );
};

export default Notifications;