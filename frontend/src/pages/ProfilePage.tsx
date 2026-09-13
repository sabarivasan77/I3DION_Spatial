import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { User, Bell, Shield, Settings as SettingsIcon, StickyNote, HelpCircle, Save, CheckCircle2, LogOut } from 'lucide-react';

export function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Account' | 'Notifications' | 'Privacy' | 'Preferences' | 'SideNote' | 'Support'>('Account');

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const [fullName, setFullName] = useState(user?.name || 'John Smith');
  const [email, setEmail] = useState(user?.email || 'john.smith@example.com');
  const [organization, setOrganization] = useState(user?.companyId || 'Not associated');
  const [accountType, setAccountType] = useState('Individual User');

  // Relocated Side Note State
  const [sideNotes, setSideNotes] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('i3dion_side_notes') || '["Inspect compressor valve tolerances", "Follow up on modular building AR anchor setup"]');
  });
  const [newNote, setNewNote] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const updated = [newNote.trim(), ...sideNotes];
    setSideNotes(updated);
    localStorage.setItem('i3dion_side_notes', JSON.stringify(updated));
    setNewNote('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 select-none">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-black text-slate-900">Profile & Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          {/* Settings Sub-Sidebar Tabs Matching Screen 8 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-3 space-y-1 h-fit shadow-2xs">
            <button
              onClick={() => setActiveTab('Account')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === 'Account' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User size={16} /> Account
            </button>
            <button
              onClick={() => setActiveTab('Notifications')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === 'Notifications' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell size={16} /> Notifications
            </button>
            <button
              onClick={() => setActiveTab('Privacy')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === 'Privacy' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Shield size={16} /> Privacy
            </button>
            <button
              onClick={() => setActiveTab('Preferences')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === 'Preferences' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SettingsIcon size={16} /> Preferences
            </button>
            {/* Relocated Side Note Tab */}
            <button
              onClick={() => setActiveTab('SideNote')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === 'SideNote' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <StickyNote size={16} /> Side Note
            </button>
            <button
              onClick={() => setActiveTab('Support')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === 'Support' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <HelpCircle size={16} /> Support
            </button>
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-red-600 bg-red-50/60 hover:bg-red-100/80 hover:text-red-700 transition border border-red-200/80"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>

          {/* Main Tab Body */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-2xs">
            {activeTab === 'Account' && (
              <form onSubmit={handleSaveInfo} className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900">Account Information</h2>
                  <p className="text-xs text-slate-500">Manage your personal profile details and contact settings.</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F172A] text-lg font-black text-white shadow-md">
                    {fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Change Photo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Organization</label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
                    <input
                      type="text"
                      readOnly
                      value={accountType}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500"
                    />
                  </div>
                </div>

                {savedSuccess && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <CheckCircle2 size={16} /> Profile changes saved successfully!
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
                  >
                    <Save size={15} /> Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Relocated Side Note Tab */}
            {activeTab === 'SideNote' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900">Side Note</h2>
                  <p className="text-xs text-slate-500">Your personal notepad for spatial exploration reminders.</p>
                </div>

                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Type a new side note..."
                    className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                    >
                      Add Note
                    </button>
                  </div>
                </form>

                <div className="space-y-2 pt-2">
                  {sideNotes.map((note, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-3 border-slate-100">Notification Preferences</h2>
                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <span>Email updates for new 3D products</span>
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <span>Enquiry replies and responses</span>
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'Privacy' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-3 border-slate-100">Privacy Controls</h2>
                <p className="text-xs text-slate-500">Manage your profile visibility and activity sharing.</p>
              </div>
            )}

            {activeTab === 'Preferences' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-3 border-slate-100">Display Preferences</h2>
                <p className="text-xs text-slate-500">Configure theme and default 3D rendering modes.</p>
              </div>
            )}

            {activeTab === 'Support' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-3 border-slate-100">Help & Support</h2>
                <p className="text-xs text-slate-500">Need assistance? Contact support@i3dion.com</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
