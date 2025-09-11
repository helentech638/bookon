import React, { useState, useRef, useEffect } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon, 
  ListBulletIcon,
  LinkIcon,
  PhotoIcon,
  CodeBracketIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
  availablePlaceholders?: string[];
  onPlaceholderInsert?: (placeholder: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter your content...',
  className = '',
  showPreview = true,
  availablePlaceholders = [],
  onPlaceholderInsert
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const placeholderElement = document.createElement('span');
      placeholderElement.className = 'placeholder-tag bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono';
      placeholderElement.contentEditable = 'false';
      placeholderElement.textContent = `{${placeholder}}`;
      placeholderElement.setAttribute('data-placeholder', placeholder);
      
      range.deleteContents();
      range.insertNode(placeholderElement);
      
      // Move cursor after the placeholder
      range.setStartAfter(placeholderElement);
      range.setEndAfter(placeholderElement);
      selection.removeAllRanges();
      selection.addRange(range);
      
      updateContent();
      setShowPlaceholders(false);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        updateContent();
      }
    }
  };

  useEffect(() => {
    if (editorRef.current && !isPreview) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isPreview]);

  const toolbarButtons = [
    {
      icon: BoldIcon,
      command: 'bold',
      title: 'Bold',
      shortcut: 'Ctrl+B'
    },
    {
      icon: ItalicIcon,
      command: 'italic',
      title: 'Italic',
      shortcut: 'Ctrl+I'
    },
    {
      icon: UnderlineIcon,
      command: 'underline',
      title: 'Underline',
      shortcut: 'Ctrl+U'
    },
    {
      icon: ListBulletIcon,
      command: 'insertUnorderedList',
      title: 'Bullet List'
    },
    {
      icon: LinkIcon,
      action: insertLink,
      title: 'Insert Link'
    },
    {
      icon: PhotoIcon,
      action: insertImage,
      title: 'Insert Image'
    }
  ];

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              onClick={() => button.action ? button.action() : formatText(button.command)}
              title={`${button.title}${button.shortcut ? ` (${button.shortcut})` : ''}`}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            >
              <button.icon className="w-4 h-4" />
            </button>
          ))}
          
          {availablePlaceholders.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowPlaceholders(!showPlaceholders)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="Insert Placeholder"
              >
                <CodeBracketIcon className="w-4 h-4" />
              </button>
              
              {showPlaceholders && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-500 mb-2">Available Placeholders:</p>
                    <div className="space-y-1">
                      {availablePlaceholders.map((placeholder) => (
                        <button
                          key={placeholder}
                          onClick={() => insertPlaceholder(placeholder)}
                          className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          {`{${placeholder}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {showPreview && (
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title={isPreview ? 'Edit Mode' : 'Preview Mode'}
          >
            {isPreview ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Editor/Preview Area */}
      <div className="min-h-[300px]">
        {isPreview ? (
          <div 
            className="p-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={updateContent}
            onBlur={updateContent}
            className="p-4 min-h-[300px] focus:outline-none"
            style={{ minHeight: '300px' }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Placeholder Styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .placeholder-tag {
          user-select: none;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }
        
        .prose p {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .prose ul, .prose ol {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .prose img {
          margin-top: 0;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
