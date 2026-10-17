import React from 'react';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PermissionDeniedProps {
  requiredPermission?: string;
  userRole?: string;
  message?: string;
}

export const PermissionDeniedState: React.FC<PermissionDeniedProps> = ({
  requiredPermission,
  userRole,
  message,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600">
          <ShieldX className="h-8 w-8" />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">Access Restricted</h2>
        
        <p className="mt-2 text-sm text-slate-600">
          {message || 'Your current organizational role does not have authorization to view or edit this resource.'}
        </p>

        {(userRole || requiredPermission) && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 text-left space-y-1">
            {userRole && <div><strong>Your Role:</strong> <span className="font-mono text-slate-800">{userRole}</span></div>}
            {requiredPermission && <div><strong>Required Permission:</strong> <span className="font-mono text-slate-800">{requiredPermission}</span></div>}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};
