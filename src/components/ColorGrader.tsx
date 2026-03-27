import React, { useState } from 'react';
import { Palette, RotateCcw, RotateCw, Type, Save } from 'lucide-react';

export interface ColorGrade {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  tint: number;
}

interface ColorGraderProps {
  initialGrade?: ColorGrade;
  onGradeChange?: (grade: ColorGrade) => void;
  onSave?: (grade: ColorGrade) => void;
  onCancel?: () => void;
}

const defaultGrade: ColorGrade = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  tint: 0
};

export function ColorGrader({ 
  initialGrade = defaultGrade, 
  onGradeChange, 
  onSave, 
  onCancel 
}: ColorGraderProps) {
  const [grade, setGrade] = useState<ColorGrade>(initialGrade);

  const handleSliderChange = (key: keyof ColorGrade, value: number) => {
    const newGrade = { ...grade, [key]: value };
    setGrade(newGrade);
    onGradeChange?.(newGrade);
  };

  const resetToDefault = () => {
    setGrade(defaultGrade);
    onGradeChange?.(defaultGrade);
  };

  const handleSave = () => {
    onSave?.(grade);
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 space-y-6 border border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Color Grading</h3>
      </div>

      <div className="space-y-4">
        {/* Brightness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Brightness</label>
            <span className="text-sm text-slate-400">{grade.brightness}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={grade.brightness}
            onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Contrast</label>
            <span className="text-sm text-slate-400">{grade.contrast}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={grade.contrast}
            onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Saturation</label>
            <span className="text-sm text-slate-400">{grade.saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={grade.saturation}
            onChange={(e) => handleSliderChange('saturation', Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Warmth */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Warmth</label>
            <span className="text-sm text-slate-400">{grade.warmth > 0 ? '+' : ''}{grade.warmth}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={grade.warmth}
            onChange={(e) => handleSliderChange('warmth', Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Tint */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Tint</label>
            <span className="text-sm text-slate-400">{grade.tint > 0 ? '+' : ''}{grade.tint}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={grade.tint}
            onChange={(e) => handleSliderChange('tint', Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={resetToDefault}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        
        <div className="flex-1" />
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        
        {onSave && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #8b5cf6;
          cursor: pointer;
          border-radius: 50%;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #8b5cf6;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  );
}
