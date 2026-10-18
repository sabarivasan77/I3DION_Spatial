import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ScanLine, ChevronLeft } from 'lucide-react';
import { QrScannerModal } from '../../components/hub/QrScannerModal';

export function HubScanPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    navigate('/hub');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <div className="p-4 flex items-center justify-between border-b border-white/10 z-10">
        <Link to="/hub" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white">
          <ChevronLeft className="w-4 h-4" /> Back to Hub
        </Link>
        <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">I3DION Optical Scanner</span>
      </div>

      <QrScannerModal open={open} onClose={handleClose} />

      {!open && (
        <div className="p-8 text-center space-y-4">
          <ScanLine className="w-12 h-12 text-blue-400 mx-auto" />
          <h2 className="text-lg font-bold">Scanner Closed</h2>
          <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-sm"
          >
            Reopen Camera Scanner
          </button>
        </div>
      )}
    </div>
  );
}
