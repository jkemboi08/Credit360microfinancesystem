import React, { useState } from 'react';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent, Type, Palette, Undo, Redo, 
  Type as CaseIcon, ChevronDown
} from 'lucide-react';

interface TextFormattingToolbarProps {
  onFormat: (command: string, value?: string) => void;
  isActive: (command: string) => boolean;
  getCurrentFont?: () => string;
  getCurrentFontSize?: () => string;
}

const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({
  onFormat,
  isActive,
  getCurrentFont,
  getCurrentFontSize
}) => {
  const [showCaseMenu, setShowCaseMenu] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [currentFont, setCurrentFont] = useState('Aptos');
  const [currentFontSize, setCurrentFontSize] = useState('12');

  const caseOptions = [
    { command: 'transformToUppercase', label: 'UPPERCASE', description: 'Convert to uppercase' },
    { command: 'transformToLowercase', label: 'lowercase', description: 'Convert to lowercase' },
    { command: 'transformToCapitalize', label: 'Title Case', description: 'Convert to title case' },
    { command: 'transformToSentenceCase', label: 'Sentence case', description: 'Convert to sentence case' }
  ];

  const listOptions = [
    { command: 'insertUnorderedList', label: '• Bullet List', description: 'Create bullet list' },
    { command: 'insertOrderedList', label: '1. Numbered List', description: 'Create numbered list' },
    { command: 'insertUnorderedList', label: '○ Circle List', description: 'Create circle list', value: 'circle' },
    { command: 'insertUnorderedList', label: '■ Square List', description: 'Create square list', value: 'square' },
    { command: 'insertOrderedList', label: 'a. Letter List', description: 'Create letter list', value: 'lower-alpha' },
    { command: 'insertOrderedList', label: 'A. Letter List', description: 'Create uppercase letter list', value: 'upper-alpha' },
    { command: 'insertOrderedList', label: 'i. Roman List', description: 'Create roman numeral list', value: 'lower-roman' },
    { command: 'insertOrderedList', label: 'I. Roman List', description: 'Create uppercase roman list', value: 'upper-roman' }
  ];

  const fontFamilies = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Calibri', label: 'Calibri' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Aptos', label: 'Aptos' }
  ];

  const fontSizeOptions = [
    { value: '8', label: '8' },
    { value: '9', label: '9' },
    { value: '10', label: '10' },
    { value: '11', label: '11' },
    { value: '12', label: '12' },
    { value: '14', label: '14' },
    { value: '16', label: '16' },
    { value: '18', label: '18' },
    { value: '20', label: '20' },
    { value: '24', label: '24' },
    { value: '28', label: '28' },
    { value: '32', label: '32' },
    { value: '36', label: '36' },
    { value: '48', label: '48' },
    { value: '72', label: '72' }
  ];

  const colorPalette = [
    // Standard colors
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Red', value: '#FF0000' },
    { name: 'Green', value: '#00FF00' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Yellow', value: '#FFFF00' },
    { name: 'Magenta', value: '#FF00FF' },
    { name: 'Cyan', value: '#00FFFF' },
    
    // Dark colors
    { name: 'Dark Red', value: '#800000' },
    { name: 'Dark Green', value: '#008000' },
    { name: 'Dark Blue', value: '#000080' },
    { name: 'Dark Gray', value: '#808080' },
    { name: 'Dark Orange', value: '#FF8C00' },
    { name: 'Dark Purple', value: '#800080' },
    { name: 'Dark Cyan', value: '#008080' },
    { name: 'Dark Pink', value: '#FF1493' },
    
    // Light colors
    { name: 'Light Gray', value: '#C0C0C0' },
    { name: 'Light Blue', value: '#ADD8E6' },
    { name: 'Light Green', value: '#90EE90' },
    { name: 'Light Pink', value: '#FFC0CB' },
    { name: 'Light Yellow', value: '#FFFFE0' },
    { name: 'Light Cyan', value: '#E0FFFF' },
    { name: 'Light Orange', value: '#FFE4B5' },
    { name: 'Light Purple', value: '#DDA0DD' },
    
    // Professional colors
    { name: 'Navy', value: '#000080' },
    { name: 'Maroon', value: '#800000' },
    { name: 'Olive', value: '#808000' },
    { name: 'Teal', value: '#008080' },
    { name: 'Silver', value: '#C0C0C0' },
    { name: 'Gold', value: '#FFD700' },
    { name: 'Indigo', value: '#4B0082' },
    { name: 'Crimson', value: '#DC143C' }
  ];

  const handleCaseTransform = (command: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        let transformedText = '';
        switch (command) {
          case 'transformToUppercase':
            transformedText = selectedText.toUpperCase();
            break;
          case 'transformToLowercase':
            transformedText = selectedText.toLowerCase();
            break;
          case 'transformToCapitalize':
            transformedText = selectedText.replace(/\b\w/g, l => l.toUpperCase());
            break;
          case 'transformToSentenceCase':
            transformedText = selectedText.charAt(0).toUpperCase() + selectedText.slice(1).toLowerCase();
            break;
        }
        
        range.deleteContents();
        range.insertNode(document.createTextNode(transformedText));
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    setShowCaseMenu(false);
  };

  const handleListStyle = (command: string, value?: string) => {
    onFormat(command, value);
    setShowListMenu(false);
  };

  // Function to get current font family from selection
  const getCurrentFontFamily = () => {
    if (getCurrentFont) {
      return getCurrentFont();
    }
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // If there's selected text, get the font from the selection
      if (range.toString().trim()) {
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
        
        if (element) {
          const computedStyle = window.getComputedStyle(element);
          const fontFamily = computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '');
          return fontFamily;
        }
      } else {
        // No selection, get from the current cursor position
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
        
        if (element) {
          const computedStyle = window.getComputedStyle(element);
          const fontFamily = computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '');
          return fontFamily;
        }
      }
    }
    return 'Aptos';
  };

  // Function to get current font size from selection
  const getCurrentFontSizeValue = () => {
    if (getCurrentFontSize) {
      return getCurrentFontSize();
    }
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // If there's selected text, get the font size from the selection
      if (range.toString().trim()) {
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
        
        if (element) {
          const computedStyle = window.getComputedStyle(element);
          const fontSize = computedStyle.fontSize;
          return Math.round(parseFloat(fontSize)).toString();
        }
      } else {
        // No selection, get from the current cursor position
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
        
        if (element) {
          const computedStyle = window.getComputedStyle(element);
          const fontSize = computedStyle.fontSize;
          return Math.round(parseFloat(fontSize)).toString();
        }
      }
    }
    return '12';
  };

  // Update current font and size when selection changes
  React.useEffect(() => {
    const updateCurrentFormatting = () => {
      setCurrentFont(getCurrentFontFamily());
      setCurrentFontSize(getCurrentFontSizeValue());
    };

    document.addEventListener('selectionchange', updateCurrentFormatting);
    return () => document.removeEventListener('selectionchange', updateCurrentFormatting);
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {/* History Group */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
          <button
            onClick={() => onFormat('undo')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              isActive('undo') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('redo')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              isActive('redo') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Font Family Dropdown */}
        <div className="flex items-center gap-2 border-r border-gray-300 pr-3 mr-3">
          <label className="text-sm font-medium text-gray-700">Font:</label>
          <select
            value={currentFont}
            onChange={(e) => {
              setCurrentFont(e.target.value);
              onFormat('fontName', e.target.value);
            }}
            className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[120px]"
          >
            {fontFamilies.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size Dropdown */}
        <div className="flex items-center gap-2 border-r border-gray-300 pr-3 mr-3">
          <label className="text-sm font-medium text-gray-700">Size:</label>
          <select
            value={currentFontSize}
            onChange={(e) => {
              setCurrentFontSize(e.target.value);
              onFormat('fontSize', e.target.value);
            }}
            className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[60px]"
          >
            {fontSizeOptions.map(size => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text Formatting Group */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
          <button
            onClick={() => onFormat('bold')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('italic')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('underline')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              isActive('underline') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Text Case Dropdown */}
        <div className="flex items-center gap-2 border-r border-gray-300 pr-3 mr-3">
          <label className="text-sm font-medium text-gray-700">Case:</label>
          <div className="relative">
            <button
              onClick={() => setShowCaseMenu(!showCaseMenu)}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-1 min-w-[100px] justify-between"
            >
              <span>Change Case</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showCaseMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[200px]">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Text Case</div>
                  {caseOptions.map(option => (
                    <button
                      key={option.command}
                      onClick={() => handleCaseTransform(option.command)}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alignment Group */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
          <button
            onClick={() => onFormat('justifyLeft')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              isActive('justifyLeft') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('justifyCenter')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              isActive('justifyCenter') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('justifyRight')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              isActive('justifyRight') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('justifyFull')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              isActive('justifyFull') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists Group */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
          <div className="relative">
            <button
              onClick={() => setShowListMenu(!showListMenu)}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-1"
              title="Lists"
            >
              <List className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showListMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[200px]">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 mb-2">List Styles</div>
                  {listOptions.map(option => (
                    <button
                      key={`${option.command}-${option.value || 'default'}`}
                      onClick={() => handleListStyle(option.command, option.value)}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => onFormat('indent')}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
            title="Increase Indent"
          >
            <Indent className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('outdent')}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
            title="Decrease Indent"
          >
            <Outdent className="w-4 h-4" />
          </button>
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Color:</label>
          <div className="relative">
            <button
              onClick={() => setShowColorPalette(!showColorPalette)}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-1"
              title="Text Color"
            >
              <Palette className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showColorPalette && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[320px]">
                <div className="p-3">
                  <div className="text-xs font-semibold text-gray-500 mb-3">Text Color</div>
                  <div className="grid grid-cols-8 gap-2">
                    {colorPalette.map(color => (
                      <button
                        key={color.value}
                        onClick={() => {
                          onFormat('foreColor', color.value);
                          setShowColorPalette(false);
                        }}
                        className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        onFormat('foreColor', '#000000');
                        setShowColorPalette(false);
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Reset to Black
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close menus */}
      {(showCaseMenu || showColorPalette || showListMenu) && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setShowCaseMenu(false);
            setShowColorPalette(false);
            setShowListMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default TextFormattingToolbar;