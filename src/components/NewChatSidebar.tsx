import React, { useState } from 'react';
import { UserPlus, Users, Megaphone, ArrowLeft, Search } from 'lucide-react';

interface NewChatSidebarProps {
  onClose: () => void;
  // این توابع را می‌توانید بعداً به روتینگ یا مودال‌های واقعی وصل کنید
  onCreateGroup: () => void;
  onCreateChannel: () => void;
  onAddContact: () => void;
}

export const NewChatSidebar: React.FC<NewChatSidebarProps> = ({ onClose, onCreateGroup, onCreateChannel, onAddContact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // دیتای تستی مخاطبین (باید از استور یا API گرفته شود)
  const contacts = [
    { id: '1', name: 'Ali', status: 'last seen recently' },
    { id: '2', name: 'Reza', status: 'online' },
  ];

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 w-full sm:w-80">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800">
        <button onClick={onClose} className="p-2 mr-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">New Message</h2>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Action Buttons */}
        <div className="py-2">
          <button onClick={onCreateGroup} className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200">New Group</span>
          </button>
          
          <button onClick={onCreateChannel} className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
              <Megaphone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200">New Channel</span>
          </button>

          <button onClick={onAddContact} className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
              <UserPlus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200">Add Contact</span>
          </button>
        </div>

        <div className="h-2 bg-gray-100 dark:bg-gray-900 w-full" />

        {/* Search Bar */}
        <div className="p-3 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="pb-4">
          <div className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
            Contacts
          </div>
          {filteredContacts.map(contact => (
            <div key={contact.id} className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <div 
                className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3"
                onClick={(e) => {
                  e.stopPropagation();
                  // هندل کردن کلیک روی پروفایل (مثلاً باز کردن مودال پروفایل)
                  console.log("Go to profile", contact.id);
                }}
              >
                {contact.name.charAt(0)}
              </div>
              <div 
                className="flex-1"
                onClick={() => {
                  // هندل کردن کلیک برای رفتن به صفحه چت
                  console.log("Start chat with", contact.id);
                }}
              >
                <div className="font-semibold text-gray-800 dark:text-gray-100">{contact.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{contact.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
