export interface TagGroup {
  label: string;
  tags: string[];
}

export const TAG_GROUPS: TagGroup[] = [
  {
    label: 'Course',
    tags: [
      'Appetizers', 'Main Meal', 'Side dish', 'Soups', 'Salads', 'Sandwiches',
      'Breads', 'Desserts', 'Cookies', 'Cheesecakes', 'Ice Creams', 'Candy',
      'Frosting', 'Condiments', 'Salad Dressings', 'Preserves and Jams',
      'Snack', 'Drinks', 'Breakfasts', 'Dry Rubs',
    ],
  },
  {
    label: 'Cuisine',
    tags: [
      'American', 'Australian', 'French Inspired', 'Italian Inspired',
      'Asian Inspired', 'Indian Inspired', 'Mexican/Cuban/Latin Inspired',
      'Mediterranean Inspired', 'Irish/English/Scottish Inspired',
      'Middle Eastern/Moroccan Inspired', 'Island Inspired',
    ],
  },
  {
    label: 'Occasion & Season',
    tags: [
      'Fall', 'Winter', 'Spring', 'Summer',
      'Christmas', 'Easter', 'Thanksgiving', 'Picnic Fare', 'Special Meal', 'Camping',
    ],
  },
  {
    label: 'Dietary & Special',
    tags: ['Gluten Free', 'Kim Acceptable', "Kid's Delight", 'Quick', 'Want to make'],
  },
  {
    label: 'Other',
    tags: ['Dog', 'Gifts', 'Room scent'],
  },
];

export const ALL_TAGS: string[] = TAG_GROUPS.flatMap(g => g.tags);
