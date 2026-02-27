import React from 'react';

interface ErrorStateProps {
  message?: string;
  retry?: () => void;
}

export function ErrorState({ message = "Something went wrong.", retry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-900/50 border border-red-900/30 rounded-lg">
      <div className="text-red-500 text-5xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
      <p className="text-gray-400 max-w-md mb-6">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
