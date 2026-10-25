import React, { useEffect } from 'react';
import { useLensStore } from './store/useLensStore';
import { LensHeader } from './components/LensHeader';
import { LensSidebar } from './components/LensSidebar';
import { LensHomeView } from './views/LensHomeView';
import { LensLeadsView } from './views/LensLeadsView';
import { LensDealsView } from './views/LensDealsView';
import { LensCrmView } from './views/LensCrmView';
import { LensTasksView } from './views/LensTasksView';
import { LensEnquiriesView } from './views/LensEnquiriesView';
import { LensDocumentsView } from './views/LensDocumentsView';
import { LensAutomationsView } from './views/LensAutomationsView';
import { LensAnalyticsView } from './views/LensAnalyticsView';
import { LensProjectsView } from './views/LensProjectsView';
import { LensVisualizationsView } from './views/LensVisualizationsView';
import { LensReportsView } from './views/LensReportsView';
import { LensSavedViewsView } from './views/LensSavedViewsView';
import { LensDataExplorerView } from './views/LensDataExplorerView';
import { LensSettingsView, LensHelpView } from './views/LensSettingsView';
import { LensAiAssistantModal } from './components/LensAiAssistantModal';
import { LensPresentationOverlay } from './components/LensPresentationOverlay';

export const LensPage: React.FC = () => {
  const { activeView, fetchCrmOverview, fetchAccounts, fetchDeals, fetchTasks } = useLensStore();

  useEffect(() => {
    fetchCrmOverview();
    fetchAccounts();
    fetchDeals();
    fetchTasks();
  }, [fetchCrmOverview, fetchAccounts, fetchDeals, fetchTasks]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'home':
        return <LensHomeView />;
      case 'deals':
        return <LensDealsView />;
      case 'leads':
        return <LensLeadsView />;
      case 'crm':
        return <LensCrmView />;
      case 'tasks':
        return <LensTasksView />;
      case 'enquiries':
        return <LensEnquiriesView />;
      case 'documents':
        return <LensDocumentsView />;
      case 'automations':
        return <LensAutomationsView />;
      case 'analytics':
        return <LensAnalyticsView />;
      case 'projects':
        return <LensProjectsView />;
      case 'visualizations':
        return <LensVisualizationsView />;
      case 'reports':
        return <LensReportsView />;
      case 'saved-views':
        return <LensSavedViewsView />;
      case 'data-explorer':
        return <LensDataExplorerView />;
      case 'settings':
        return <LensSettingsView />;
      case 'help':
        return <LensHelpView />;
      default:
        return <LensHomeView />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] font-sans text-slate-900 select-none">
      {/* Isolated Left Navigation Sidebar */}
      <LensSidebar />

      {/* Main Right Content Section */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <LensHeader />

        {/* Scrollable View Body */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Lens AI Copilot Modal */}
      <LensAiAssistantModal />

      {/* Fullscreen Boardroom Presentation Overlay */}
      <LensPresentationOverlay />
    </div>
  );
};

export default LensPage;
