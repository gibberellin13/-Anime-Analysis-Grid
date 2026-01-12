import React, { useState, useEffect, useRef } from 'react';
import { Plus, Type, ChevronDown, Download, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Episode, AnalysisItem } from './types';
import EpisodeRow from './components/EpisodeRow';

declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
  }
}

const FONT_OPTIONS = [
  { label: '快乐体 (Cute)', value: 'font-kuaile' },
  { label: '行楷 (XingKai)', value: 'font-zhimang' },
  { label: '楷体风格 (Elegant)', value: 'font-xiaowei' },
  { label: '草书 (Wild)', value: 'font-liujian' },
  { label: '龙苍 (Freestyle)', value: 'font-longcang' },
  { label: '马善政 (Brush)', value: 'font-mashan' },
  { label: '思源宋体 (Formal)', value: 'font-serif-sc' },
  { label: '思源黑体 (Modern)', value: 'font-sans-sc' },
];

const App: React.FC = () => {
  const [animeTitle, setAnimeTitle] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [userFont, setUserFont] = useState('font-kuaile');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with one episode if empty
  useEffect(() => {
    if (episodes.length === 0) {
      addEpisode();
    }
  }, []);

  // Auto-resize title textarea with buffer to prevent clipping
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.style.height = 'auto';
      // Add generous buffer (+10px) to scrollHeight to prevent clipping of tall ascenders
      titleInputRef.current.style.height = (titleInputRef.current.scrollHeight + 10) + 'px';
    }
  }, [animeTitle]);

  const addEpisode = () => {
    const newEpisode: Episode = {
      id: crypto.randomUUID(),
      number: episodes.length + 1,
      title: `Episode ${episodes.length + 1}`,
      items: []
    };
    setEpisodes(prev => [...prev, newEpisode]);
  };

  const updateEpisodeContent = (id: string, newItems: AnalysisItem[]) => {
    setEpisodes(prev => prev.map(ep => {
      if (ep.id !== id) return ep;
      return {
        ...ep,
        items: newItems
      };
    }));
  };

  const deleteEpisode = (id: string) => {
    if (episodes.length <= 1) return;
    if (!window.confirm("Are you sure you want to delete this episode row?")) return;
    setEpisodes(prev => {
      const filtered = prev.filter(ep => ep.id !== id);
      // Renumber
      return filtered.map((ep, idx) => ({ ...ep, number: idx + 1 }));
    });
  };

  // --- Export Functions ---

  const handleExportPNG = async () => {
    if (!contentRef.current || !window.html2canvas) return;
    setShowExportMenu(false);

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const elem = contentRef.current;

      // 关键：使用元素的真实宽高，不允许 html2canvas 自行缩放
      const realWidth = elem.scrollWidth;
      const realHeight = elem.scrollHeight;

      const canvas = await window.html2canvas(elem, {
        scale: 3,                // 高 DPI，但不缩放布局
        backgroundColor: '#fdfdfd',
        useCORS: true,

        // 🚨 关键：强行使用真实布局宽高，不让它压缩内容
        width: realWidth,
        height: realHeight,
        windowWidth: realWidth,
        windowHeight: realHeight,

        // 避免它自己从 viewport 取宽度
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,

        // 禁用任何内部的自动调整
        allowTaint: true
      });
 
      const link = document.createElement('a');
      link.download = `${animeTitle || 'Anime_Analysis'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed. Please try again.");
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || !window.html2canvas || !window.jspdf) return;
    setShowExportMenu(false);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await window.html2canvas(contentRef.current, {
        scale: 3, // High quality for PDF too
        backgroundColor: '#fdfdfd',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${animeTitle || 'Anime_Analysis'}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
      alert("PDF Export failed.");
    }
  };

  const handleExportWord = () => {
    setShowExportMenu(false);
    
    // Construct a simple HTML document compatible with Word
    // This maintains text editability
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${animeTitle}</title>
        <style>
          body { font-family: 'Times New Roman', serif; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #f0f0f0; padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; }
          td { padding: 10px; border: 1px solid #ddd; vertical-align: top; }
          .episode-title { font-size: 18px; font-weight: bold; margin-top: 20px; }
          ul { padding-left: 20px; margin: 0; }
          li { margin-bottom: 5px; }
          .red { color: #c0392b; }
          .blue { color: #2980b9; }
          .green { color: #27ae60; }
        </style>
      </head>
      <body>
        <h1>${animeTitle || 'Anime Analysis'}</h1>
        <table border="1">
          <thead>
            <tr>
              <th style="width: 10%;">Ep</th>
              <th style="width: 30%; color: #c0392b;">Emotion (感情)</th>
              <th style="width: 30%; color: #2980b9;">Plot (剧情)</th>
              <th style="width: 30%; color: #27ae60;">Reasoning (推理)</th>
            </tr>
          </thead>
          <tbody>
    `;

    episodes.forEach(ep => {
      const emotionItems = ep.items.filter(i => i.category === 'emotion');
      const plotItems = ep.items.filter(i => i.category === 'plot');
      const reasoningItems = ep.items.filter(i => i.category === 'reasoning');

      // Helper to generate list HTML
      const renderList = (items: AnalysisItem[]) => {
        if (items.length === 0) return '';
        return `<ul>${items.map(i => `<li>${i.text}</li>`).join('')}</ul>`;
      };

      htmlContent += `
        <tr>
          <td style="text-align: center; font-weight: bold;">${ep.number}</td>
          <td>${renderList(emotionItems)}</td>
          <td>${renderList(plotItems)}</td>
          <td>${renderList(reasoningItems)}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${animeTitle || 'Anime_Analysis'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    // Moved contentRef here to capture the padding
    <div ref={contentRef} className="min-h-screen bg-[#fdfdfd] text-gray-800 p-6 md:p-12 max-w-[1600px] mx-auto selection:bg-gray-100">
      
        {/* Header */}
        <header className="mb-12 relative group z-50">
          <div 
            className="flex flex-col md:flex-row items-end gap-6 border-b border-gray-200 pb-8 relative"
            style={{
              flexShrink: 0,
              minWidth: 'max-content',
            }}
          >
            <div
              className="pt-4 overflow-visible"
              style={{
                flexShrink: 0,            // ⬅⛔ 不准压标题
                minWidth: 'max-content',  // ⬅ 内容宽度由标题决定
                width: 'auto'
              }}
            >
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Anime Analysis Log</label>
              {/* Added pt-6 and pb-2 to prevent clipping of tall fonts like Ma Shan Zheng */}
              <textarea
                ref={titleInputRef}
                value={animeTitle}
                onChange={(e) => setAnimeTitle(e.target.value)}
                placeholder="Enter Anime Title..."
                rows={1}
                className="font-serif-sc text-gray-900 bg-transparent outline-none placeholder-gray-200 transition-all focus:placeholder-gray-300 resize-none pt-6 pb-2"
                style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  transform: 'none',
                  lineHeight: 1.2,
                  minHeight: '4rem',
                  width: 'fit-content',
                  minWidth: 'max-content',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            </div>
            
            {/* Controls: Font & Export - IGNORED IN EXPORT */}
            <div className="flex flex-col items-end gap-3 pb-1" data-html2canvas-ignore>
              <div className="flex gap-3">
                  {/* Font Selector */}
                  <div className="relative inline-flex items-center">
                  <Type size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                  <ChevronDown size={14} className="absolute right-3 text-gray-400 pointer-events-none" />
                  <select 
                      value={userFont}
                      onChange={(e) => setUserFont(e.target.value)}
                      className="appearance-none bg-white pl-9 pr-10 py-2 rounded-full border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-600 outline-none cursor-pointer hover:text-gray-900 transition-all shadow-sm font-serif-sc"
                  >
                      {FONT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                  </select>
                  </div>

                  {/* Export Dropdown */}
                  <div className="relative">
                      <button 
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
                      >
                          <Download size={14} />
                          Export
                      </button>

                      {showExportMenu && (
                          <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                          {/* Z-Index 100 to stay above headers */}
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-[100] py-1 overflow-hidden">
                              <button onClick={handleExportPNG} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                  <ImageIcon size={14} className="text-purple-500" /> PNG Image
                              </button>
                              <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                  <FileText size={14} className="text-red-500" /> PDF Document
                              </button>
                              <div className="h-px bg-gray-100 my-1" />
                              <button onClick={handleExportWord} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                  <File size={14} className="text-blue-600" /> Word (.doc)
                              </button>
                          </div>
                          </>
                      )}
                  </div>
              </div>
            </div>
          </div>

          {/* Column Headers */}
          <div className="flex gap-0 mt-8 pl-14 md:pl-24 sticky top-0 bg-[#fdfdfd]/95 backdrop-blur-md z-30 py-6 border-b border-gray-100/50">
            <div className="flex-1 text-center border-r border-dashed border-gray-100 last:border-0 group/col">
              <h2 className="text-2xl font-serif-sc font-semibold text-red-700/80 tracking-widest transition-all duration-300 group-hover/col:text-red-700 group-hover/col:scale-105">
                感情
              </h2>
              <span className="block text-[9px] font-sans font-medium text-red-200 tracking-[0.3em] mt-2 uppercase">Emotion</span>
            </div>
            <div className="flex-1 text-center border-r border-dashed border-gray-100 last:border-0 group/col">
              <h2 className="text-2xl font-serif-sc font-semibold text-blue-700/80 tracking-widest transition-all duration-300 group-hover/col:text-blue-700 group-hover/col:scale-105">
                剧情
              </h2>
              <span className="block text-[9px] font-sans font-medium text-blue-200 tracking-[0.3em] mt-2 uppercase">Plot</span>
            </div>
            <div className="flex-1 text-center group/col">
              <h2 className="text-2xl font-serif-sc font-semibold text-green-700/80 tracking-widest transition-all duration-300 group-hover/col:text-green-700 group-hover/col:scale-105">
                推理
              </h2>
              <span className="block text-[9px] font-sans font-medium text-green-200 tracking-[0.3em] mt-2 uppercase">Reasoning</span>
            </div>
          </div>
        </header>

        {/* Main Grid Content */}
        <main className="flex flex-col gap-0 pb-32">
          {episodes.map((episode, idx) => (
            <EpisodeRow 
              key={episode.id} 
              episode={episode} 
              animeTitle={animeTitle}
              onUpdateEpisode={updateEpisodeContent}
              onDelete={deleteEpisode}
              fontClass={userFont}
              isLast={idx === episodes.length - 1}
            />
          ))}

          {/* Elegant Add Button - Hidden during export */}
          <div className="pl-14 md:pl-24 pt-12" data-html2canvas-ignore>
            <button 
              onClick={addEpisode}
              className="w-full py-8 border border-dashed border-gray-200 rounded-lg text-gray-300 hover:text-gray-500 hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-500 flex flex-col items-center justify-center gap-3 group"
            >
              <Plus size={24} className="opacity-50 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-serif-sc text-sm tracking-widest opacity-60">ADD NEW EPISODE</span>
            </button>
          </div>
        </main>
    </div>
  );
};

export default App;