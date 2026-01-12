import React, { useState, useRef } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { Episode, CategoryType, AnalysisItem } from '../types';
import AnalysisItemRenderer from './AnalysisCell';
import { generateAnalysisPoints } from '../services/geminiService';

interface EpisodeRowProps {
  episode: Episode;
  animeTitle: string;
  onUpdateEpisode: (id: string, newItems: AnalysisItem[]) => void;
  onDelete: (id: string) => void;
  fontClass: string;
  isLast?: boolean;
}

const EpisodeRow: React.FC<EpisodeRowProps> = ({ episode, animeTitle, onUpdateEpisode, onDelete, fontClass, isLast }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Hover state management with debounce
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // Fix: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout to avoid namespace error
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState<CategoryType | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const handleInsert = (index: number, category: CategoryType) => {
    // Clear hover immediately to prevent visual glitch
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverIndex(null);

    const newItem: AnalysisItem = {
      id: crypto.randomUUID(),
      category,
      text: ''
    };
    const newItems = [...episode.items];
    newItems.splice(index, 0, newItem);
    onUpdateEpisode(episode.id, newItems);
    
    // Immediately focus the new item
    // Small timeout to ensure render happens first
    setTimeout(() => setEditingId(newItem.id), 0);
  };

  const handleUpdateItem = (id: string, text: string) => {
    const newItems = episode.items.map(item => 
      item.id === id ? { ...item, text } : item
    );
    onUpdateEpisode(episode.id, newItems);
  };

  const handleDeleteItem = (id: string) => {
    const newItems = episode.items.filter(item => item.id !== id);
    onUpdateEpisode(episode.id, newItems);
  };

  const handleGenerate = async (category: CategoryType) => {
    if (!animeTitle) {
      alert("Please enter an Anime Title first.");
      return;
    }
    setIsGenerating(category);
    try {
      // Fix: API key is now handled directly within the service using process.env.API_KEY
      const points = await generateAnalysisPoints(animeTitle, episode.number, category);
      
      const newItems: AnalysisItem[] = points.map(text => ({
        id: crypto.randomUUID(),
        category,
        text
      }));
      
      onUpdateEpisode(episode.id, [...episode.items, ...newItems]);
    } catch (e) {
      console.error(e);
      alert("Failed to generate content.");
    } finally {
      setIsGenerating(null);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    if (rowRef.current) {
        rowRef.current.classList.add('cursor-grabbing');
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !rowRef.current) return;

    // Calculate which column was dropped into
    const rect = rowRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const colWidth = rect.width / 3;
    
    let targetCategory: CategoryType = 'emotion';
    if (x > colWidth && x < colWidth * 2) targetCategory = 'plot';
    if (x >= colWidth * 2) targetCategory = 'reasoning';

    const newItems = [...episode.items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    
    const updatedItem = { ...draggedItem, category: targetCategory };
    
    let finalDropIndex = dropIndex;
    if (draggedIndex < dropIndex) {
        finalDropIndex -= 1;
    }
    
    newItems.splice(finalDropIndex, 0, updatedItem);
    
    onUpdateEpisode(episode.id, newItems);
    setDraggedIndex(null);
    rowRef.current.classList.remove('cursor-grabbing');
  };

  const chineseNumbers = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  const getEpisodeLabel = (num: number) => {
    if (num <= 10) return `第${chineseNumbers[num - 1]}集`;
    return `第${num}集`;
  };

  // Insert Zone Logic
  const handleZoneEnter = (index: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoverIndex(index);
  };

  const handleZoneLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverIndex(null);
    }, 200); // 200ms delay to smooth out jitter
  };

  const InsertZone = ({ index }: { index: number }) => {
    const isHovered = hoverIndex === index;
    
    return (
      <div 
        className={`relative w-full z-20 group/insert transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
        style={{
          height: isHovered ? '3.5rem' : '1.5rem', // 3.5rem matches the approx height of a new row
          marginBottom: isHovered ? '0' : '-1.5rem', // Negative margin to overlap when collapsed
          zIndex: isHovered ? 50 : 10
        }}
        onMouseEnter={() => handleZoneEnter(index)}
        onMouseLeave={handleZoneLeave}
        onDragOver={(e) => {
            e.preventDefault();
            handleZoneEnter(index);
        }}
        onDrop={(e) => {
            handleZoneLeave();
            handleDrop(e, index);
        }}
        data-html2canvas-ignore // Ignore insert zones in screenshots
      >
        {/* Hover Hit Area (Invisible but functional) */}
        <div className="absolute inset-0 bg-transparent w-full h-full" />

        {/* Visual Line Animation */}
        <div 
          className={`absolute top-1/2 left-4 right-4 h-px transform -translate-y-1/2 transition-all duration-500 pointer-events-none
            ${isHovered ? 'bg-gray-300 opacity-60 scale-x-100' : 'bg-transparent opacity-0 scale-x-50'}`}
        />

        {/* Buttons Container */}
        <div 
            className={`absolute inset-0 flex items-start pt-3 transition-all duration-300 
            ${isHovered ? 'opacity-100 delay-75 transform translate-y-0' : 'opacity-0 pointer-events-none transform -translate-y-2'}`}
        >
          {/* We render 3 regions matching columns */}
          {(['emotion', 'plot', 'reasoning'] as CategoryType[]).map((cat) => (
            <div key={cat} className="flex-1 flex justify-center h-full px-3">
               <button 
                  onClick={() => handleInsert(index, cat)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-1 rounded-md group/btn
                  `}
                  title={`Add ${cat} point`}
                >
                  {/* Plus Icon - Aligned to where the bullet point will be */}
                  <div className={`
                     w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300
                     ring-1 ring-inset
                     ${cat === 'emotion' ? 'text-red-400 ring-red-200 bg-red-50 group-hover/btn:bg-red-100 group-hover/btn:scale-110' : ''}
                     ${cat === 'plot' ? 'text-blue-400 ring-blue-200 bg-blue-50 group-hover/btn:bg-blue-100 group-hover/btn:scale-110' : ''}
                     ${cat === 'reasoning' ? 'text-green-400 ring-green-200 bg-green-50 group-hover/btn:bg-green-100 group-hover/btn:scale-110' : ''}
                  `}>
                    <Plus size={10} strokeWidth={3} />
                  </div>
                  
                  {/* Phantom text line to visualize where text goes */}
                  <div className={`h-px flex-1 opacity-0 group-hover/btn:opacity-30 transition-opacity duration-300
                     ${cat === 'emotion' ? 'bg-red-300' : ''}
                     ${cat === 'plot' ? 'bg-blue-300' : ''}
                     ${cat === 'reasoning' ? 'bg-green-300' : ''}
                  `} />
                </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex w-full ${!isLast ? 'mb-12' : ''}`} ref={rowRef}>
      {/* Sidebar Label */}
      <div className="w-14 md:w-24 pt-2 flex flex-col items-center flex-shrink-0 border-r border-gray-100">
        <h3 className="font-serif-sc font-medium text-lg text-gray-400 writing-vertical py-2">
          {getEpisodeLabel(episode.number)}
        </h3>
        <button 
          onClick={() => onDelete(episode.id)}
          className="mt-2 p-2 rounded-full text-gray-200 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 hover:opacity-100 focus:opacity-100"
          title="Delete Episode"
          data-html2canvas-ignore // Ignore delete button
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative isolate">
        
        {/* Background Grid Columns */}
        <div className="absolute inset-0 flex pointer-events-none z-0">
          <div className="flex-1 border-r border-dashed border-gray-100 bg-red-50/[0.03]">
             {episode.items.filter(i => i.category === 'emotion').length === 0 && (
                <div 
                  className="absolute top-0 right-0 p-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  data-html2canvas-ignore
                >
                    <button 
                    onClick={() => handleGenerate('emotion')}
                    className="p-1.5 rounded-full text-red-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Auto-generate Emotion"
                    disabled={!!isGenerating}
                    >
                    <Sparkles size={14} className={isGenerating === 'emotion' ? 'animate-spin' : ''} />
                    </button>
                </div>
             )}
          </div>
          <div className="flex-1 border-r border-dashed border-gray-100 bg-blue-50/[0.03]">
            {episode.items.filter(i => i.category === 'plot').length === 0 && (
                 <div 
                  className="absolute top-0 right-0 p-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  data-html2canvas-ignore
                 >
                    <button 
                    onClick={() => handleGenerate('plot')}
                    className="p-1.5 rounded-full text-blue-200 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    title="Auto-generate Plot"
                    disabled={!!isGenerating}
                    >
                    <Sparkles size={14} className={isGenerating === 'plot' ? 'animate-spin' : ''} />
                    </button>
                </div>
             )}
          </div>
          <div className="flex-1 bg-green-50/[0.03]">
             {episode.items.filter(i => i.category === 'reasoning').length === 0 && (
                <div 
                  className="absolute top-0 right-0 p-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  data-html2canvas-ignore
                >
                    <button 
                    onClick={() => handleGenerate('reasoning')}
                    className="p-1.5 rounded-full text-green-200 hover:text-green-500 hover:bg-green-50 transition-colors"
                    title="Auto-generate Reasoning"
                    disabled={!!isGenerating}
                    >
                    <Sparkles size={14} className={isGenerating === 'reasoning' ? 'animate-spin' : ''} />
                    </button>
                </div>
             )}
          </div>
        </div>

        {/* Content Items */}
        <div className="relative flex flex-col w-full z-10 py-2 group">
          
          <InsertZone index={0} />

          {episode.items.map((item, index) => (
            <React.Fragment key={item.id}>
              {/* Item Row */}
              <div 
                className={`flex w-full transition-all duration-300 min-h-[3rem] ${draggedIndex === index ? 'opacity-30 scale-[0.99]' : 'opacity-100'}`}
              >
                {/* 3 Columns structure to keep alignment perfect */}
                <div className="flex-1 px-2">
                  {item.category === 'emotion' && (
                    <AnalysisItemRenderer
                      item={item}
                      index={index}
                      isEditing={editingId === item.id}
                      setEditingId={setEditingId}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onDragStart={handleDragStart}
                      fontClass={fontClass}
                    />
                  )}
                </div>

                <div className="flex-1 px-2">
                  {item.category === 'plot' && (
                    <AnalysisItemRenderer
                      item={item}
                      index={index}
                      isEditing={editingId === item.id}
                      setEditingId={setEditingId}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onDragStart={handleDragStart}
                      fontClass={fontClass}
                    />
                  )}
                </div>

                <div className="flex-1 px-2">
                  {item.category === 'reasoning' && (
                    <AnalysisItemRenderer
                      item={item}
                      index={index}
                      isEditing={editingId === item.id}
                      setEditingId={setEditingId}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onDragStart={handleDragStart}
                      fontClass={fontClass}
                    />
                  )}
                </div>
              </div>
              
              <InsertZone index={index + 1} />
            </React.Fragment>
          ))}
          
          {episode.items.length === 0 && (
             <div className="h-24 w-full flex items-center justify-center pointer-events-none opacity-40">
                <span className="text-gray-300 font-serif-sc text-sm italic tracking-widest">Empty Episode Log</span>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EpisodeRow;