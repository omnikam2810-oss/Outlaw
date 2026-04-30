import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import socket from '../../api/socket';
import { useAuth } from '../../context/useAuth';

export default function NotificationSocketBridge() {
  const { user } = useAuth();

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) return undefined;

    const handleNotification = (data) => {
      toast.success(data.message);
    };

    socket.on('notification', handleNotification);
    socket.emit('register:user', userId);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [user]);

  return null;
}
