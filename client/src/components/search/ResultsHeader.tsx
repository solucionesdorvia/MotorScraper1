import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sortOptions } from '@/lib/utils';

type ResultsHeaderProps = {
  make?: string;
  model?: string;
  year?: string;
  totalResults: number;
  onSortChange: (sort: string) => void;
  currentSort: string;
};

const ResultsHeader = ({ 
  make = '', 
  model = '', 
  year = '', 
  totalResults, 
  onSortChange,
  currentSort
}: ResultsHeaderProps) => {
  const formatTitle = () => {
    let title = '';
    if (year) title += `${year} `;
    if (make) title += `${make.charAt(0).toUpperCase() + make.slice(1)} `;
    if (model) title += `${model.charAt(0).toUpperCase() + model.slice(1)}`;
    return title.trim() || 'Search Results';
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{formatTitle()}</h2>
          <p className="text-neutral-600 text-sm">{totalResults} resultados encontrados</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm text-neutral-700 whitespace-nowrap">Ordenar por:</label>
          <Select 
            defaultValue={currentSort || "relevance"}
            onValueChange={onSortChange}
          >
            <SelectTrigger className="border border-neutral-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-auto">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value || "relevance"}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ResultsHeader;
