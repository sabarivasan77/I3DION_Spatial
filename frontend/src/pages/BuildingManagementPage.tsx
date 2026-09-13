import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Layers,
  Sparkles,
  Trash2,
  ChevronRight,
  FolderPlus,
  ArrowLeft,
  X,
  Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, BuildingRecord } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';

export function BuildingManagementPage() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingRecord | null>(null);

  // Modals
  const [createBuildingOpen, setCreateBuildingOpen] = useState(false);
  const [buildingName, setBuildingName] = useState('');
  const [buildingDesc, setBuildingDesc] = useState('');

  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');

  // Experience Assignment Modal
  const [assignExpOpen, setAssignExpOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [availableExperiences, setAvailableExperiences] = useState<any[]>([]);
  const [selectedExpId, setSelectedExpId] = useState<string>('');

  useEffect(() => {
    loadBuildings();
    loadExperiences();
  }, [token]);

  const loadBuildings = () => {
    if (!token) return;
    setLoading(true);
    api.getBuildings(token)
      .then((data) => {
        setBuildings(data || []);
        if (selectedBuilding) {
          const updated = data.find((b) => b.id === selectedBuilding.id);
          if (updated) setSelectedBuilding(updated);
        }
      })
      .catch((err) => {
        console.error('Failed to load buildings:', err);
      })
      .finally(() => setLoading(false));
  };

  const loadExperiences = () => {
    const stored = localStorage.getItem('i3dion.experiences');
    if (stored) {
      try {
        setAvailableExperiences(JSON.parse(stored));
      } catch (err) {}
    } else {
      setAvailableExperiences([
        { id: 'exp-default-1', title: 'Compressor Operations Demo', status: 'PUBLISHED', updatedAt: new Date().toISOString() },
        { id: 'exp-pub-8921', title: 'Industrial Valve 3D View', status: 'PUBLISHED', updatedAt: new Date().toISOString() },
        { id: 'exp-default-2', title: 'Robotic Arm Quality Inspection', status: 'DRAFT', updatedAt: new Date().toISOString() }
      ]);
    }
  };

  const handleCreateBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingName.trim() || !token) return;

    api.createBuilding(token, { name: buildingName.trim(), description: buildingDesc.trim() })
      .then((newBldg) => {
        success('Building Created', `Facility "${newBldg.name}" has been created.`);
        setBuildingName('');
        setBuildingDesc('');
        setCreateBuildingOpen(false);
        loadBuildings();
      })
      .catch((err) => toastError('Error', err.message || 'Could not create building.'));
  };

  const handleDeleteBuilding = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete building "${name}"?`) || !token) return;
    api.deleteBuilding(token, id)
      .then(() => {
        success('Building Removed', `Facility building "${name}" deleted.`);
        if (selectedBuilding?.id === id) setSelectedBuilding(null);
        loadBuildings();
      })
      .catch((err) => toastError('Error', err.message || 'Could not delete building.'));
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding || !sectionName.trim() || !token) return;

    api.createSection(token, selectedBuilding.id, { name: sectionName.trim(), description: sectionDesc.trim() })
      .then(() => {
        success('Section Added', `Section "${sectionName}" added to ${selectedBuilding.name}.`);
        setSectionName('');
        setSectionDesc('');
        setCreateSectionOpen(false);
        loadBuildings();
      })
      .catch((err) => toastError('Error', err.message || 'Could not create section.'));
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!confirm('Delete this section?') || !token) return;
    api.deleteSection(token, sectionId)
      .then(() => {
        success('Section Deleted', 'Section removed successfully.');
        loadBuildings();
      })
      .catch((err) => toastError('Error', err.message || 'Could not delete section.'));
  };

  const handleAssignExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedBuilding || !activeSectionId || !selectedExpId) return;

    const section = selectedBuilding.sections.find((s) => s.id === activeSectionId);
    if (!section) return;

    const updatedExpIds = Array.from(new Set([...(section.experienceIds || []), selectedExpId]));

    api.updateSection(token, activeSectionId, { experienceIds: updatedExpIds })
      .then(() => {
        success('Experience Linked', 'Experience attached to section.');
        setAssignExpOpen(false);
        setSelectedExpId('');
        loadBuildings();
      })
      .catch((err) => toastError('Error', err.message || 'Could not link experience.'));
  };

  const handleRemoveExpFromSection = (sectionId: string, expId: string) => {
    if (!token || !selectedBuilding) return;
    const section = selectedBuilding.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const updatedExpIds = (section.experienceIds || []).filter((id) => id !== expId);
    api.updateSection(token, sectionId, { experienceIds: updatedExpIds })
      .then(() => {
        success('Unlinked', 'Experience unlinked from section.');
        loadBuildings();
      })
      .catch((err) => toastError('Error', err.message || 'Could not unlink experience.'));
  };

  const filteredBuildings = buildings.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
        <span className="hover:text-slate-900 cursor-pointer" onClick={() => setSelectedBuilding(null)}>
          Facility Buildings
        </span>
        {selectedBuilding && (
          <>
            <ChevronRight size={16} />
            <span className="text-slate-900 font-semibold">{selectedBuilding.name}</span>
          </>
        )}
      </div>

      {!selectedBuilding ? (
        /* Buildings List View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                <Building2 className="text-blue-600" size={32} />
                Facility Buildings & Spatial Sections
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Organize spatial experiences into facility buildings, plant rooms, and operational sections.
              </p>
            </div>
            <button
              onClick={() => setCreateBuildingOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Create Building</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search facility buildings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* Buildings Grid */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : filteredBuildings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Building2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Facility Buildings Found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Create facility buildings to group room sections and interactive 3D spatial experiences.
              </p>
              <button
                onClick={() => setCreateBuildingOpen(true)}
                className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all inline-flex items-center gap-2"
              >
                <Plus size={18} />
                <span>Create Building</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBuildings.map((building) => {
                const totalExperiences = building.sections?.reduce(
                  (acc, s) => acc + (s.experienceIds?.length || 0),
                  0
                ) || 0;

                return (
                  <div
                    key={building.id}
                    className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                          <Building2 size={24} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                            {building.status}
                          </span>
                          <button
                            onClick={() => handleDeleteBuilding(building.id, building.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Delete Building"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mt-4 group-hover:text-blue-600 transition-colors">
                        {building.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {building.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Layers size={14} className="text-slate-400" />
                          {building.sections?.length || 0} Sections
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles size={14} className="text-slate-400" />
                          {totalExperiences} Experiences
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedBuilding(building)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Selected Building & Section View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to Buildings</span>
              </button>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <Building2 className="text-blue-600" size={32} />
                {selectedBuilding.name}
              </h1>
              <p className="text-sm text-slate-500 mt-1">{selectedBuilding.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCreateSectionOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
              >
                <FolderPlus size={18} />
                <span>Add Section</span>
              </button>
            </div>
          </div>

          {/* Sections List */}
          {selectedBuilding.sections?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Layers size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Sections in Building</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Add sections like "Compressor Room" or "Control Panel" to organize spatial experiences.
              </p>
              <button
                onClick={() => setCreateSectionOpen(true)}
                className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all inline-flex items-center gap-2"
              >
                <FolderPlus size={18} />
                <span>Add Section</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedBuilding.sections?.map((section) => (
                <div
                  key={section.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{section.name}</h3>
                        {section.description && (
                          <p className="text-xs text-slate-500">{section.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveSectionId(section.id);
                          setAssignExpOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Link Experience</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Delete Section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Experience Cards inside Section */}
                  {section.experienceIds?.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No experiences assigned to this section. Click "Link Experience" to attach an experience.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {section.experienceIds?.map((expId) => {
                        const exp = availableExperiences.find((e) => e.id === expId) || {
                          id: expId,
                          title: `Experience ${expId}`,
                          status: 'PUBLISHED',
                        };

                        return (
                          <div
                            key={expId}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between hover:bg-white transition-all shadow-2xs"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Box size={18} className="text-blue-600" />
                                <span className="font-bold text-sm text-slate-900 line-clamp-1">
                                  {exp.title || exp.name}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveExpFromSection(section.id, expId)}
                                className="text-slate-400 hover:text-red-600 p-1"
                                title="Remove from section"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-200/60">
                              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {exp.status || 'READY'}
                              </span>

                              <button
                                onClick={() => navigate(`/studio?experienceId=${expId}`)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                              >
                                <Sparkles size={12} />
                                <span>OmniStudio</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Building Modal */}
      {createBuildingOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl p-6 border-l border-slate-200 font-sans">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" />
              Create Facility Building
            </h3>
            <button onClick={() => setCreateBuildingOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateBuilding} className="space-y-4 mt-6 flex-1">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Building Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Industrial Compressor Facility"
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Description</label>
              <textarea
                rows={4}
                placeholder="Facility description and operational scope..."
                value={buildingDesc}
                onChange={(e) => setBuildingDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateBuildingOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm"
              >
                Create Facility
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Section Modal */}
      {createSectionOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl p-6 border-l border-slate-200 font-sans">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FolderPlus size={20} className="text-blue-600" />
              Add Section to Building
            </h3>
            <button onClick={() => setCreateSectionOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateSection} className="space-y-4 mt-6 flex-1">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Section Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Compressor Room"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Section Description</label>
              <textarea
                rows={4}
                placeholder="Description of equipment, control panels, or room area..."
                value={sectionDesc}
                onChange={(e) => setSectionDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateSectionOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm"
              >
                Add Section
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Link Experience Modal */}
      {assignExpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-sans backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                Link Experience to Section
              </h3>
              <button onClick={() => setAssignExpOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignExperience} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Select Experience</label>
                <select
                  required
                  value={selectedExpId}
                  onChange={(e) => setSelectedExpId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Choose Experience --</option>
                  {availableExperiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title || exp.name || exp.id} ({exp.status || 'READY'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssignExpOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedExpId}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  Link Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
