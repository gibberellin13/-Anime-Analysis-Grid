import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { AnalysisItem } from '../types';

interface AnalysisItemProps {
  item: AnalysisItem;
  isEditing: boolean;
  setEditingId: (id: string | null) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  index: number;
  fontClass: string;
}

const AnalysisItemRenderer: React.FC<AnalysisItemProps> = ({ 
  item, 
  isEditing, 
  setEditingId, 
  onUpdate, 
  onDelete,
  onDragStart,
  index,
  fontClass
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Theme configuration
  const theme = {
    emotion: {
      dot: 'bg-red-400/90 shadow-red-100 ring-red-50',
      text: 'text-gray-700',
      hover: 'hover:bg-red-50/30',
    },
    plot: {
      dot: 'bg-blue-400/90 shadow-blue-100 ring-blue-50',
      text: 'text-gray-700',
      hover: 'hover:bg-blue-50/30',
    },
    reasoning: {
      dot: 'bg-green-400/90 shadow-green-100 ring-green-50',
      text: 'text-gray-700',
      hover: 'hover:bg-green-50/30',
    }
  }[item.category];

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Reset height to calculate correct scrollHeight
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setEditingId(null);
    }
  };

  return (
    <div 
      className={`group relative flex items-start gap-3 w-full py-2 px-3 rounded-md transition-all duration-300 ${theme.hover}`}
    >
      {/* Bullet Point (Now functions as Drag Handle) */}
      <div 
        className="pt-1.5 cursor-grab active:cursor-grabbing p-1 -ml-1 opacity-80 hover:opacity-100"
        draggable
        onDragStart={(e) => onDragStart(e, index)}
      >
        <div className={`w-2 h-2 rounded-full shadow-sm transition-all duration-300 group-hover:scale-125 group-hover:ring-4 ${theme.dot}`} />
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={item.text}
            onChange={(e) => {
              onUpdate(item.id, e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onBlur={() => setEditingId(null)}
            onKeyDown={handleKeyDown}
            placeholder="Type here..."
            className={`w-full bg-transparent focus:ring-0 outline-none resize-none overflow-hidden py-0 text-lg ${theme.text} ${fontClass} leading-relaxed`}
            rows={1}
          />
        ) : (
          <div 
            className={`text-lg leading-relaxed ${theme.text} ${fontClass} cursor-text whitespace-pre-wrap break-words min-h-[1.5em]`}
            onClick={() => setEditingId(item.id)}
          >
            {item.text || <span className="opacity-20 font-sans text-sm font-normal italic">Click to edit...</span>}
          </div>
        )}
      </div>

      {/* Delete Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50/50 rounded-full transition-all duration-200"
        data-html2canvas-ignore
      >
        <X size={12} />
      </button>
    </div>
  );
};

export default AnalysisItemRenderer;