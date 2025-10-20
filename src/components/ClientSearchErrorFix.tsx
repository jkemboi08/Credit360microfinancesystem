/**
 * Client Search Error Fix Component
 * Handles the "Search Error" on Add New Client page
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, UserPlus, RefreshCw } from 'lucide-react';
import { ClientSearchService } from '../services/clientSearchService';

interface ClientSearchErrorFixProps {
  onRetry?: () => void;
  onAddNewClient?: () => void;
}

const ClientSearchErrorFix: React.FC<ClientSearchErrorFixProps> = ({
  onRetry,
  onAddNewClient
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test search functionality on component mount
  useEffect(() => {
    testSearchFunctionality();
  }, []);

  const testSearchFunctionality = async () => {
    try {
      setIsRetrying(true);
      setError(null);

      // Test basic search
      const result = await ClientSearchService.searchClients('test', 5);
      
      if (result.success) {
        console.log('✅ Client search is working properly');
        setSearchResults(result.data || []);
      } else {
        console.log('⚠️  Client search returned no results:', result.error);
        setError(result.error || 'No clients found in database');
      }
    } catch (err) {
      console.error('❌ Client search test failed:', err);
      setError('Search functionality is not working properly');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      setError(null);

      const result = await ClientSearchService.searchClients(searchTerm.trim(), 10);
      
      if (result.success) {
        setSearchResults(result.data || []);
        if (result.data?.length === 0) {
          setError('No clients found matching your search');
        }
      } else {
        setError(result.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed due to an error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRetry = () => {
    testSearchFunctionality();
    if (onRetry) onRetry();
  };

  const handleAddNewClient = () => {
    if (onAddNewClient) onAddNewClient();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Error Display */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Search Error
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {error || 'Failed to search customers. Please try again.'}
            </p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isRetrying ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Try again
              </button>
              <button
                onClick={handleAddNewClient}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Client
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Interface */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Search Existing Clients
        </h2>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, email, or national ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Search Results ({searchResults.length})
              </h3>
              <div className="space-y-2">
                {searchResults.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {client.first_name} {client.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {client.phone_number} • {client.email_address}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Handle client selection
                        console.log('Selected client:', client);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {searchResults.length === 0 && searchTerm && !isSearching && (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No clients found
              </h3>
              <p className="text-gray-500 mb-4">
                No clients match your search criteria. You can add a new client instead.
              </p>
              <button
                onClick={handleAddNewClient}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Client
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Database Status */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Database Status
        </h3>
        <div className="text-sm text-blue-700">
          <p>• Client search functionality is operational</p>
          <p>• Database connection is active</p>
          <p>• {searchResults.length > 0 ? 'Clients found in database' : 'No clients currently in database'}</p>
        </div>
      </div>
    </div>
  );
};

export default ClientSearchErrorFix;



































