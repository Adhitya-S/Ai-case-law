"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import SearchForm from "@/components/SearchForm";
import DocumentView from "@/components/DocumentView";
import { type Document } from "./types/document";
import { sanitizeString } from "@/lib/utils";

interface SearchResult {
  metadata: Document["metadata"];
  content: string;
}

const runBootstrapProcedure = async () => {
  const response = await fetch("/api/bootstrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json();
    console.log(body);
    throw new Error(`API request failed with status ${response.status}`);
  }
};

const checkAndBootstrapIndex = async (
  setIsBootstrapping: (isBootstrapping: boolean) => void,
  setIsIndexReady: (isIndexReady: boolean) => void
) => {
  setIsBootstrapping(true);
  await runBootstrapProcedure();
  setIsBootstrapping(false);
  setIsIndexReady(true);
};

const handleSearch = async (
  query: string,
  setResults: (results: SearchResult[]) => void,
  setIsSearching: (isSearching: boolean) => void,
  setRecentSearches: React.Dispatch<React.SetStateAction<string[]>>
) => {
  setIsSearching(true);
  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const body = await response.json();
    console.log(body);
    throw new Error(`API request failed with status ${response.status}`);
  }

  const { results } = await response.json();
  setResults(results);
  setIsSearching(false);

  // Updating the recent searches state correctly
  setRecentSearches((prev: string[]) => {
    // Check if the search term is already in the recent searches
    const updatedSearches = prev.includes(query) 
      ? prev 
      : [query, ...prev.slice(0, 4)];  // Keep only the last 5 recent searches

    return updatedSearches;  // Return the updated state
  });
};


export default function Home() {
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isIndexReady, setIsIndexReady] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SearchResult | null>(
    null
  );
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6;

  useEffect(() => {
    checkAndBootstrapIndex(setIsBootstrapping, setIsIndexReady);
  }, []);

  const clearResults = () => {
    setQuery("");
    setResults([]);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  };

  const paginatedResults = results.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  const totalPages = Math.ceil(results.length / resultsPerPage);

  if (selectedDocument) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-gray-800 dark:to-gray-900">
        <DocumentView
          document={selectedDocument}
          quote={selectedDocument.metadata.pageContent}
          onBack={() => setSelectedDocument(null)}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${
        isDarkMode ? "from-gray-800 to-gray-900" : "from-teal-50 to-white"
      }`}
    >
      <header className="bg-teal-700 text-white dark:bg-gray-900 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <h1 className="text-2xl font-bold">AI - Semantics Law Search</h1>
          <button
            className="p-2 rounded-md bg-white text-teal-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isBootstrapping && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm border border-teal-300">
              <p className="text-gray-600">Processing legal documents...</p>
              <div className="spinner border-4 border-t-transparent border-teal-600 rounded-full w-5 h-5 animate-spin"></div>
            </div>
          </div>
        )}

        {isIndexReady && !isBootstrapping && (
          <>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-teal-700 dark:text-gray-200 mb-3">
                Welcome to AI Case Law Search
              </h1>
              <p className=" text-green-950 font-semibold dark:text-gray-400">
                Streamline your legal research with natural language queries.
              </p>
              <p className="text-center text-black dark:text-gray-400 text-lg mb-8">
                "Case Law Search streamlines the search for legal papers and precedents using advanced natural language processing. It allows users to easily find relevant case law and legal concepts from a large repository of legal writings using natural language queries in English. This tool seeks to ease complex legal research by returning accurate and timely results for locating key case law. The tool's accessible design navigates an ocean of legal information with ease, so scholars, students, and practitioners seeking deep case law resources can access them through this resource."
            </p>
            </div>

            <div className="max-w-3xl mx-auto mt-8">
              <SearchForm
                suggestedSearches={[
                  "Cases about personal freedoms being violated",
                  "Cases involving a US President",
                  "Cases involving guns",
                  "Cases where Nixon was the defendant",
                  "How much power does the commerce clause give Congress?",
                  "Cases about personal rights or congressional overreach?",
                  "Cases involving the ability to pay for an attorney",
                  "Cases about the right to remain silent",
                  "Landmark cases that shaped freedom of speech laws",
                  "Cases where defendant was found with a gun",
                  "What cases involved personal rights or congressional overreach?",
                  "Cases where the judge expressed grave concern",
                ]}
                onSearch={(query: string) => {
                  handleSearch(query, setResults, setIsSearching, setRecentSearches);
                  setQuery(query);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Recent Searches
              </h2>
              <div className="flex space-x-2 mt-2">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    className="bg-teal-100 dark:bg-gray-700 text-teal-700 dark:text-gray-300 px-3 py-1 rounded-md"
                    onClick={() => {
                      setQuery(term);
                      handleSearch(term, setResults, setIsSearching, setRecentSearches);
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {isSearching && (
              <div className="flex justify-center mt-4">
                <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-teal-300">
                  <p className="text-gray-600">Searching documents...</p>
                  <div className="spinner border-3 border-t-transparent border-teal-600 rounded-full w-4 h-4 animate-spin"></div>
                </div>
              </div>
            )}

            {results.length > 0 && query && (
              <>
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Results for "{query}"
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {paginatedResults.map((result, idx) => (
                      <Card
                        key={idx}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedDocument(result)}
                      >
                        <CardContent>
                          <h4 className="text-teal-700 font-semibold">
                            {result.metadata.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                            {sanitizeString(result.metadata.pageContent)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="px-4 py-2 bg-teal-500 text-white rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <p className="text-gray-700 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-4 py-2 bg-teal-500 text-white rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="bg-teal-700 text-white dark:bg-gray-900 py-4 text-center">
        <p>&copy; 2025 Case Law Search. All rights reserved.</p>
      </footer>
    </div>
  );
}

