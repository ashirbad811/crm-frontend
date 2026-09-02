import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '../features/api/notificationsApiSlice';
import { LayoutDashboard, Users, UserPlus, Briefcase, Activity, LogOut, Bell, CheckCircle, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import { apiSlice } from '../features/api/apiSlice';

const Layout = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const socket = useSocket();

  const { data: notifications } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  useEffect(() => {
    if (socket) {
      socket.on('newNotification', (notification) => {
        toast.info(notification.message, {
          position: "bottom-right",
          autoClose: 5000,
        });
        // Invalidate tags to trigger a refetch of notifications
        dispatch(apiSlice.util.invalidateTags(['Notification']));
      });

      return () => {
        socket.off('newNotification');
      };
    }
  }, [socket, dispatch]);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const logoutHandler = () => {
    dispatch(logout());
    navigate('/login');
  };

  const hasPermission = (moduleName, action) => {
    if (!userInfo || !userInfo.role || !userInfo.role.permissions) return false;
    const perm = userInfo.role.permissions.find(p => p.module === moduleName);
    return perm ? perm.actions.includes(action) : false;
  };

  const navItems = [];
  if (hasPermission('Dashboard', 'View')) navItems.push({ name: 'Dashboard', path: '/', icon: LayoutDashboard });
  if (hasPermission('Leads', 'View')) navItems.push({ name: 'Leads', path: '/leads', icon: UserPlus });
  if (hasPermission('Customers', 'View')) navItems.push({ name: 'Customers', path: '/customers', icon: Users });
  if (hasPermission('Deals', 'View')) navItems.push({ name: 'Deals', path: '/deals', icon: Briefcase });
  if (hasPermission('Activities', 'View')) navItems.push({ name: 'Activities', path: '/activities', icon: Activity });
  if (hasPermission('Users', 'View')) navItems.push({ name: 'Users', path: '/users', icon: Users });
  if (hasPermission('Roles', 'View')) navItems.push({ name: 'Roles', path: '/roles', icon: Shield });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">CRM Pro</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {userInfo?.name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{userInfo?.name}</p>
              <p className="text-xs text-gray-500">{userInfo?.role?.name}</p>
            </div>
          </div>
          <button
            onClick={logoutHandler}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:text-red-600 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col relative w-full">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">
            {navItems.find(item => item.path === location.pathname)?.name || 'Overview'}
          </h2>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 transition rounded-full hover:bg-gray-100"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="fixed top-16 right-2 left-2 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-[80vh] flex flex-col sm:origin-top-right">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllAsRead()}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifications?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                  ) : (
                    notifications?.map(notif => (
                      <div 
                        key={notif._id} 
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer flex items-start space-x-3 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                        onClick={() => !notif.read && markAsRead(notif._id)}
                      >
                        <div className="mt-0.5">
                          {!notif.read ? (
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-600"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm ${!notif.read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            </div>
            
            {/* Mobile Logout Button in Header */}
            <button
              onClick={logoutHandler}
              className="md:hidden p-2 text-gray-500 hover:text-red-600 transition rounded-full hover:bg-gray-100"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </header>
        <main className="p-4 md:p-8 pb-24 md:pb-8 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-1 py-1 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-14 rounded-lg transition ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-[9px] font-medium leading-none truncate w-full text-center px-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  );
};

export default Layout;
