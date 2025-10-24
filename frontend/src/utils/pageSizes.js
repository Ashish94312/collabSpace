// Page size configurations
// All dimensions are in pixels at 96 DPI (standard web resolution)
export const PAGE_SIZES = {
  a4: {
    name: 'A4',
    width: 794, // 210mm at 96 DPI
    height: 1123, // 297mm at 96 DPI
    displayName: 'A4 (210×297mm)',
    description: 'Standard international size'
  },
  letter: {
    name: 'Letter',
    width: 816, // 8.5 inches at 96 DPI
    height: 1056, // 11 inches at 96 DPI
    displayName: 'Letter (8.5×11in)',
    description: 'Standard US size'
  },
  legal: {
    name: 'Legal',
    width: 816, // 8.5 inches at 96 DPI
    height: 1344, // 14 inches at 96 DPI
    displayName: 'Legal (8.5×14in)',
    description: 'US legal size'
  },
  a3: {
    name: 'A3',
    width: 1123, // 297mm at 96 DPI
    height: 1587, // 420mm at 96 DPI
    displayName: 'A3 (297×420mm)',
    description: 'Large format'
  },
  a5: {
    name: 'A5',
    width: 560, // 148mm at 96 DPI
    height: 794, // 210mm at 96 DPI
    displayName: 'A5 (148×210mm)',
    description: 'Small format'
  },
  tabloid: {
    name: 'Tabloid',
    width: 1056, // 11 inches at 96 DPI
    height: 1632, // 17 inches at 96 DPI
    displayName: 'Tabloid (11×17in)',
    description: 'Large US format'
  }
};

// Get page size by key
export const getPageSize = (sizeKey) => {
  return PAGE_SIZES[sizeKey] || PAGE_SIZES.a4;
};

// Get all page size options for select dropdown
export const getPageSizeOptions = () => {
  return Object.entries(PAGE_SIZES).map(([key, size]) => ({
    value: key,
    label: size.displayName,
    description: size.description
  }));
}; 