import { Box, Select, FormControl, FormLabel } from '@chakra-ui/react';
import { Category } from '../types/categories';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory?: number;
  onCategoryChange: (categoryId: number) => void;
}

export default function CategorySelector({ 
  categories,
  selectedCategory,
  onCategoryChange
}: CategorySelectorProps) {
  return (
    <FormControl>
      <FormLabel color="white" fontWeight="medium">Select Category</FormLabel>
      <Select
        value={selectedCategory || ''}
        onChange={(e) => onCategoryChange(Number(e.target.value))}
        placeholder="All Categories"
        color="white"
        borderColor="trivia.primary"
        bg="accent.500"
        _hover={{ borderColor: 'brand.400' }}
        _focus={{ borderColor: 'brand.300', boxShadow: '0 0 0 1px #OAA574' }}
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
    </FormControl>
  );
} 