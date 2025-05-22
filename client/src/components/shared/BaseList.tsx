import { ReactNode, useState } from 'react';
import { Entity, PaginationData } from '../../types/common';
import Pagination from './Pagination';
import Modal from '../common/Modal';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render: (item: T, helpers: ColumnHelpers<T>) => ReactNode;
}

export interface ColumnHelpers<T> {
  formatters?: Record<string, (value: any) => string>;
  getEntityById?: (id: string, collection: any[], key?: string) => any;
  getStyle?: (item: T) => Record<string, string>;
}

export interface BaseListProps<T extends Entity> {
  items: T[];
  columns: Column<T>[];
  paginationData: PaginationData;
  onPageChange: (page: number) => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  showDeleted?: boolean;
  rowClickAction?: (item: T) => void | Promise<T>;
  detailModalContent?: (item: T | null, closeModal: () => void) => ReactNode;
  actionsColumn?: {
    header: string;
    width?: string;
    render: (item: T, actions: { 
      onEdit?: (item: T) => void;
      onDelete?: (id: string) => void;
      onRestore?: (id: string) => void;
    }) => ReactNode;
  };
  emptyStateMessage?: string;
  className?: string;
}

export function BaseList<T extends Entity>({
  items,
  columns,
  paginationData,
  onPageChange,
  onEdit,
  onDelete,
  onRestore,
  showDeleted = false,
  rowClickAction,
  detailModalContent,
  actionsColumn,
  emptyStateMessage = 'No items found.',
  className = ''
}: BaseListProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filter items by deleted status if specified
  const filteredItems = showDeleted
    ? items.filter(item => item.isDeleted)
    : items.filter(item => !item.isDeleted);
  
  const handleRowClick = async (item: T) => {
    if (rowClickAction) {
      setIsLoading(true);
      try {
        await rowClickAction(item);
        if (detailModalContent) {
          setSelectedItem(item);
          setIsDetailModalOpen(true);
        }
      } catch (error) {
        console.error('Error handling row click:', error);
      } finally {
        setIsLoading(false);
      }
    } else if (detailModalContent) {
      setSelectedItem(item);
      setIsDetailModalOpen(true);
    }
  };
  
  if (filteredItems.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg shadow p-6 text-center text-gray-400 border border-gray-700">
        {showDeleted ? `No deleted ${emptyStateMessage}` : emptyStateMessage}
      </div>
    );
  }
  
  return (
    <div className={`bg-gray-900 rounded-lg shadow border border-gray-700 ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 table-fixed">
          <thead className="bg-gray-800">
            <tr>
              {columns.map(column => (
                <th 
                  key={column.key} 
                  className={`${column.width || ''} px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider`}
                >
                  {column.header}
                </th>
              ))}
              
              {actionsColumn && (
                <th className={`${actionsColumn.width || 'w-28'} px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider`}>
                  {actionsColumn.header}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {filteredItems.map(item => (
              <tr 
                key={item._id} 
                className="hover:bg-gray-800 cursor-pointer"
                onClick={() => handleRowClick(item)}
              >
                {columns.map(column => (
                  <td key={`${item._id}-${column.key}`} className="px-6 py-4 text-sm text-gray-300">
                    {column.render(item, {})}
                  </td>
                ))}
                
                {actionsColumn && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {actionsColumn.render(item, { onEdit, onDelete, onRestore })}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Server Pagination */}
      <div className="px-6 py-3 bg-gray-800">
        <Pagination 
          currentPage={paginationData.page}
          totalPages={paginationData.totalPages}
          onPageChange={onPageChange}
        />
      </div>

      {/* Detail Modal */}
      {detailModalContent && (
        <Modal
          isOpen={isDetailModalOpen}
          title="Details"
          onClose={() => setIsDetailModalOpen(false)}
        >
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            detailModalContent(selectedItem, () => setIsDetailModalOpen(false))
          )}
        </Modal>
      )}
    </div>
  );
}

export default BaseList;
