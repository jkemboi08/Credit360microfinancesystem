import React, { useState, useEffect, useRef } from 'react';

interface MultiPageDisplayProps {
  content: string;
  isEditing: boolean;
  onContentChange?: (content: string) => void;
  showPageLayout: boolean;
  contractEditorRef?: React.RefObject<HTMLDivElement>;
}

const MultiPageDisplay: React.FC<MultiPageDisplayProps> = ({
  content,
  isEditing,
  onContentChange,
  showPageLayout,
  contractEditorRef
}) => {
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Split content into pages based on A4 height
  const splitContentIntoPages = (htmlContent: string): string[] => {
    if (!showPageLayout) {
      return [htmlContent];
    }

    // For now, let's use a simpler approach that's more reliable
    // Split by double line breaks (paragraphs) and estimate page breaks
    const paragraphs = htmlContent.split(/\n\s*\n/);
    const pages: string[] = [];
    let currentPage = '';
    let currentPageLength = 0;
    
    // More conservative estimate for A4 page content
    const maxCharsPerPage = 2000; // Conservative estimate for A4 page
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (!paragraph) continue;
      
      // Calculate paragraph length (strip HTML tags for length calculation)
      const paragraphLength = paragraph.replace(/<[^>]*>/g, '').length;
      
      // If adding this paragraph would exceed page limit, start new page
      if (currentPageLength + paragraphLength > maxCharsPerPage && currentPage.trim() !== '') {
        pages.push(currentPage.trim());
        currentPage = paragraph;
        currentPageLength = paragraphLength;
      } else {
        currentPage += (currentPage ? '\n\n' : '') + paragraph;
        currentPageLength += paragraphLength;
      }
    }
    
    // Add the last page if it has content
    if (currentPage.trim() !== '') {
      pages.push(currentPage.trim());
    }
    
    // If no pages were created, return the original content
    if (pages.length === 0) {
      return [htmlContent];
    }
    
    return pages;
  };

  useEffect(() => {
    const pageContent = splitContentIntoPages(content);
    setPages(pageContent);
  }, [content, showPageLayout]);

  // Force page recalculation when content changes
  useEffect(() => {
    if (content) {
      const pageContent = splitContentIntoPages(content);
      setPages(pageContent);
    }
  }, [content]);

  const handleContentChange = (newContent: string) => {
    if (onContentChange) {
      onContentChange(newContent);
    }
    
    // Force page recalculation when content changes
    const pageContent = splitContentIntoPages(newContent);
    setPages(pageContent);
  };

  const renderPage = (pageContent: string, pageIndex: number) => (
    <div
      key={pageIndex}
      className={`a4-page bg-white shadow-2xl border border-gray-300 mb-8 relative`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '25mm',
        margin: '0 auto',
        position: 'relative',
        borderRadius: '4px',
        pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Page margins indicator */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-6 border border-dashed border-gray-200 rounded"></div>
        <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 font-medium">
          Page {pageIndex + 1}
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
          A4 (210mm × 297mm)
        </div>
      </div>

      {/* Page content */}
      {isEditing ? (
        <div
          ref={pageIndex === 0 ? contractEditorRef : undefined}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => {
            const htmlContent = e.currentTarget.innerHTML;
            // Update the specific page content
            const newPages = [...pages];
            newPages[pageIndex] = htmlContent;
            setPages(newPages);
            handleContentChange(newPages.join('\n\n'));
          }}
          className="contract-editor w-full min-h-[247mm] p-0 font-['Aptos'] text-xs leading-relaxed resize-none"
          style={{
            fontFamily: 'Aptos, Arial, sans-serif',
            fontSize: '12px',
            lineHeight: '1.6',
            minHeight: '247mm',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            outline: 'none'
          }}
          dangerouslySetInnerHTML={{
            __html: pageContent
          }}
        />
      ) : (
        <div
          className="w-full min-h-[247mm] p-0"
          style={{
            fontFamily: 'Aptos, Arial, sans-serif',
            fontSize: '12px',
            lineHeight: '1.6',
            minHeight: '247mm'
          }}
          dangerouslySetInnerHTML={{
            __html: pageContent
          }}
        />
      )}

      {/* Page separator line */}
      {pageIndex < pages.length - 1 && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gray-300"></div>
      )}
    </div>
  );

  if (!showPageLayout) {
    // Single page view
    return (
      <div className="w-full">
        {isEditing ? (
          <div
            ref={contractEditorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              const htmlContent = e.currentTarget.innerHTML;
              handleContentChange(htmlContent);
            }}
            className="contract-editor w-full h-96 p-4 border border-gray-300 rounded-lg font-['Aptos'] text-xs leading-relaxed resize-none"
            style={{
              fontFamily: 'Aptos, Arial, sans-serif',
              fontSize: '12px',
              lineHeight: '1.6',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
            dangerouslySetInnerHTML={{
              __html: content
            }}
          />
        ) : (
          <div
            className="prose max-w-none p-4"
            style={{
              fontFamily: 'Aptos, Arial, sans-serif',
              fontSize: '12px',
              lineHeight: '1.6'
            }}
            dangerouslySetInnerHTML={{
              __html: content
            }}
          />
        )}
      </div>
    );
  }

  // Multi-page view
  return (
    <div className="flex justify-center bg-gray-100 min-h-screen py-8">
      <div className="space-y-8" ref={containerRef}>
        {pages.map((pageContent, index) => renderPage(pageContent, index))}
      </div>
    </div>
  );
};

export default MultiPageDisplay;
