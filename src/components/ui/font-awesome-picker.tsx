import React, { useState, useMemo } from 'react';
import { allFontAwesomeIcons, fontAwesomeCategories, fontAwesomeIcons } from '@/data/fontAwesomeIcons';
import { Input } from './input';
import { Button } from './button';

interface FontAwesomePickerProps {
  onSelect: (iconName: string) => void;
  currentIcon?: string;
  onClose?: () => void;
}

export function FontAwesomePicker({
  onSelect,
  currentIcon,
  onClose,
}: FontAwesomePickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter icons based on search term and category
  const filteredIcons = useMemo(() => {
    let icons = searchTerm ? allFontAwesomeIcons : (selectedCategory ? fontAwesomeIcons[selectedCategory as keyof typeof fontAwesomeIcons] || [] : allFontAwesomeIcons);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      icons = icons.filter(icon => icon.toLowerCase().includes(term));
    }

    return icons;
  }, [searchTerm, selectedCategory]);

  const handleIconSelect = (icon: string) => {
    onSelect(icon);
    setSearchTerm('');
    setSelectedCategory(null);
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Icon</h3>
        <Input
          type="text"
          placeholder="Search icons (e.g., 'home', 'heart', 'star')..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedCategory(null);
          }}
          className="w-full"
        />
      </div>

      {/* Category Filters */}
      {!searchTerm && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 overflow-x-auto">
          <div className="flex gap-2 flex-nowrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap"
            >
              All
            </Button>
            {fontAwesomeCategories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Icon Grid */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {filteredIcons.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {filteredIcons.map((icon) => (
              <button
                key={icon}
                onClick={() => handleIconSelect(icon)}
                className={`
                  p-3 rounded-lg border-2 transition-all hover:bg-blue-50 hover:border-blue-400
                  flex items-center justify-center cursor-pointer
                  ${currentIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                `}
                title={icon}
              >
                <i className={`fas fa-${icon} text-xl text-gray-700`} />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No icons found matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
