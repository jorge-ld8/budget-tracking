// client/src/components/accounts/AccountList.tsx
import React from 'react';
import { Account } from '../../types/account';
import { formatCurrency } from '../../utils/formatters';
import { PaginationData } from '../../types/common';
import BaseList, { Column } from '../shared/BaseList';

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  showDeleted?: boolean;
  paginationData: PaginationData;
  onPageChange: (page: number) => void;
}

const AccountList: React.FC<AccountListProps> = ({
  accounts,
  onEdit,
  onDelete,
  onRestore,
  showDeleted = false,
  paginationData,
  onPageChange
}) => {
  const getTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      checking: 'Checking',
      savings: 'Savings',
      credit: 'Credit Card',
      investment: 'Investment',
      cash: 'Cash',
      other: 'Other'
    };
    
    return typeLabels[type.toLowerCase()] || type;
  };

  // Define columns for the BaseList
  const columns: Column<Account>[] = [
    {
      key: 'name',
      header: 'Name',
      width: 'w-40',
      render: (account) => (
        <span className="whitespace-nowrap">{account.name}</span>
      )
    },
    {
      key: 'type',
      header: 'Type',
      width: 'w-32',
      render: (account) => (
        <span className="whitespace-nowrap">{getTypeLabel(account.type)}</span>
      )
    },
    {
      key: 'balance',
      header: 'Balance',
      width: 'w-32',
      render: (account) => (
        <span className="whitespace-nowrap font-medium">{formatCurrency(account.balance)}</span>
      )
    },
    {
      key: 'description',
      header: 'Description',
      width: 'w-60',
      render: (account) => (
        <div className="truncate max-w-xs" title={account.description || ''}>
          {account.description || '-'}
        </div>
      )
    }
  ];

  // Define the actions column
  const actionsColumn = {
    header: 'Actions',
    width: 'w-28',
    render: (account: Account, actions: {
      onEdit?: (account: Account) => void;
      onDelete?: (id: string) => void;
      onRestore?: (id: string) => void;
    }) => {
      if (!account.isDeleted) {
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                actions.onEdit?.(account);
              }}
              className="text-indigo-400 hover:text-indigo-300 mr-4"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                actions.onDelete?.(account._id);
              }}
              className="text-red-500 hover:text-red-400"
            >
              Delete
            </button>
          </>
        );
      } else if (actions.onRestore) {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              actions.onRestore?.(account._id);
            }}
            className="text-green-500 hover:text-green-400"
          >
            Restore
          </button>
        );
      }
      return null;
    }
  };

  // Define the detail modal content
  const detailModalContent = (account: Account | null, closeModal: () => void) => {
    if (!account) {
      return (
        <div className="text-center text-gray-400 py-4">
          Account not found
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400">Name</h3>
            <p className="text-gray-300">{account.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Type</h3>
            <p className="text-gray-300">{getTypeLabel(account.type)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Balance</h3>
            <p className="text-gray-300">{formatCurrency(account.balance)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Status</h3>
            <p className="text-gray-300">
              {account.isDeleted 
                ? <span className="text-red-500">Deleted</span> 
                : <span className="text-green-500">Active</span>}
            </p>
          </div>
        </div>
        
        {account.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-400">Description</h3>
            <p className="text-gray-300 mt-1">{account.description}</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={closeModal}
            className="px-4 py-2 border border-gray-700 text-gray-300 rounded-md bg-gray-800 hover:bg-gray-700"
          >
            Close
          </button>
          {!account.isDeleted && (
            <button
              onClick={() => {
                closeModal();
                onEdit(account);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <BaseList
      items={accounts}
      columns={columns}
      paginationData={paginationData}
      onPageChange={onPageChange}
      onEdit={onEdit}
      onDelete={onDelete}
      onRestore={onRestore}
      showDeleted={showDeleted}
      detailModalContent={detailModalContent}
      actionsColumn={actionsColumn}
      emptyStateMessage={showDeleted ? 'No deleted accounts found.' : 'No accounts found.'}
    />
  );
};

export default AccountList;