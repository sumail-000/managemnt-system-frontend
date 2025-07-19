import { Badge } from '@/components/ui/badge';
import { ALLERGEN_COLORS, DIETARY_COLORS } from '@/types/ingredient';

interface TagDisplayProps {
  tags: string[];
  allergens: string[];
  size?: 'sm' | 'default';
}

export const TagDisplay = ({ tags, allergens, size = 'default' }: TagDisplayProps) => {
  const getTagColor = (tag: string, isAllergen: boolean) => {
    if (isAllergen) {
      return ALLERGEN_COLORS[tag as keyof typeof ALLERGEN_COLORS] || 'bg-red-100 text-red-800';
    }
    return DIETARY_COLORS[tag as keyof typeof DIETARY_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const allTags = [
    ...allergens.map(allergen => ({ name: allergen, isAllergen: true })),
    ...tags.map(tag => ({ name: tag, isAllergen: false }))
  ];

  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {allTags.map(({ name, isAllergen }, index) => (
        <Badge
          key={`${name}-${index}`}
          variant="secondary"
          className={`${getTagColor(name, isAllergen)} ${
            size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'
          } transition-all duration-200 hover:scale-105`}
        >
          {isAllergen && (
            <span className="mr-1 text-xs" title="Allergen">⚠️</span>
          )}
          {name}
        </Badge>
      ))}
    </div>
  );
};