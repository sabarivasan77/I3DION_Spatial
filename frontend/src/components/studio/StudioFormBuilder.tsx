import React, { useState } from 'react';
import { StudioDatasetSchema, StudioFieldSchema } from '../../api/studioApi';
import { FormInput, Plus, Trash2, Send, Save, CheckCircle2, ShieldAlert } from 'lucide-react';

interface StudioFormBuilderProps {
  schema: StudioDatasetSchema;
  onGenerateForm?: (formConfig: any) => void;
  onClose?: () => void;
}

export const StudioFormBuilder: React.FC<StudioFormBuilderProps> = ({ schema, onGenerateForm, onClose }) => {
  const [formTitle, setFormTitle] = useState(`${schema.name} Form`);
  const [submitText, setSubmitText] = useState('Submit Data Record');
  const [selectedFields, setSelectedFields] = useState<string[]>(
    (schema.fields || []).filter(f => !f.is_readonly).map(f => f.field_name)
  );

  const toggleField = (fieldName: string) => {
    if (selectedFields.includes(fieldName)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldName));
    } else {
      setSelectedFields([...selectedFields, fieldName]);
    }
  };

  const handleBuildForm = () => {
    const activeFields = (schema.fields || []).filter(f => selectedFields.includes(f.field_name));
    const formConfig = {
      dataset_key: schema.dataset_key,
      title: formTitle,
      submit_text: submitText,
      fields: activeFields.map((f, idx) => ({
        id: `form-field-${f.field_name}`,
        field_name: f.field_name,
        label: f.display_name,
        type: f.field_type,
        required: f.is_required,
        order: idx + 1
      }))
    };

    if (onGenerateForm) onGenerateForm(formConfig);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 space-y-5 select-none font-sans max-w-2xl mx-auto shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <FormInput size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Visual Low-Code Form Builder</h3>
            <p className="text-xs text-slate-400">Generate form layout and validation controls from `{schema.name}` schema</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-bold">
            Close
          </button>
        )}
      </div>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-300 mb-1">Form Title</label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 font-semibold"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-300 mb-1">Submit Button Text</label>
          <input
            type="text"
            value={submitText}
            onChange={(e) => setSubmitText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 font-semibold"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-300 mb-2">Select Dataset Fields to Include</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            {(schema.fields || []).map((f) => (
              <label
                key={f.field_name}
                className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer text-xs ${
                  selectedFields.includes(f.field_name)
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.includes(f.field_name)}
                  onChange={() => toggleField(f.field_name)}
                  className="hidden"
                />
                <span className="truncate">{f.display_name} ({f.field_type})</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
        <button
          onClick={handleBuildForm}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-2"
        >
          <Save size={14} /> Generate Form Component
        </button>
      </div>
    </div>
  );
};
