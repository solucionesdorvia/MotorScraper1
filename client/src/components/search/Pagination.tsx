import { Button } from '@/components/ui/button';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;
  
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;
  
  const getPageNumbers = () => {
    let pages = [];
    const maxVisiblePages = 3;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Add middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage === 1) {
        endPage = Math.min(totalPages - 1, 3);
      } else if (currentPage === totalPages) {
        startPage = Math.max(2, totalPages - 2);
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  return (
    <div className="mt-6 flex justify-center">
      <nav className="inline-flex rounded-md shadow">
        <Button
          variant="outline"
          className="px-4 py-2 text-neutral-500 bg-white rounded-l-md border border-neutral-300 hover:bg-neutral-100"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isPrevDisabled}
        >
          Previous
        </Button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300"
            >
              ...
            </span>
          ) : (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? "default" : "outline"}
              className={`px-4 py-2 ${
                currentPage === page
                  ? 'text-white bg-primary border border-primary hover:bg-primary/90'
                  : 'text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100'
              }`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </Button>
          )
        ))}
        
        <Button
          variant="outline"
          className="px-4 py-2 text-neutral-500 bg-white rounded-r-md border border-neutral-300 hover:bg-neutral-100"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isNextDisabled}
        >
          Next
        </Button>
      </nav>
    </div>
  );
};

export default Pagination;
