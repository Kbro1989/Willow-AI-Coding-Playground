
import React, { useState } from 'react';
import { BookOpen, Search, Code, Plus, Trash2, Copy, ArrowRightCircle } from 'lucide-react';
// import { useStore } from '../store';

interface Snippet {
    id: string;
    title: string;
    code: string;
    language: string;
    tags: string[];
    description?: string;
    category: string;
}

// Initial seed data
const INITIAL_SNIPPETS: Snippet[] = [
    {
        id: '1',
        title: 'React Functional Component',
        category: 'React',
        language: 'typescript',
        tags: ['template', 'ui'],
        description: 'Basic structure for a functional component with props.',
        code: `interface Props {
  title: string;
}

export const Component: React.FC<Props> = ({ title }) => {
  return (
    <div className="p-4">
      <h1>{title}</h1>
    </div>
  );
};`
    },
    {
        id: '2',
        title: 'Tailwind Flex Center',
        category: 'CSS',
        language: 'css',
        tags: ['layout', 'utility'],
        description: 'Utility classes to center content.',
        code: `flex items-center justify-center h-full w-full`
    },
    {
        id: '3',
        title: 'Async Fetch Hook',
        category: 'Hooks',
        language: 'typescript',
        tags: ['data', 'api'],
        description: 'Custom hook for data fetching with loading state.',
        code: `const useFetch = (url: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); });
  }, [url]);

  return { data, loading };
};`
    }
];

export const CodeLibrary: React.FC = () => {
    const [snippets, setSnippets] = useState<Snippet[]>(INITIAL_SNIPPETS);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

    const categories = ['All', ...Array.from(new Set(snippets.map(s => s.category)))];

    const filteredSnippets = snippets.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
            s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleInject = (snippet: Snippet) => {
        // In a real scenario, this would inject into the active editor
        // For now, we'll copy to clipboard as a fallback or mock action
        navigator.clipboard.writeText(snippet.code);
        alert(`Snippet "${snippet.title}" copied to clipboard! (Injection API WIP)`);
    };

    return (
        <div className="flex h-full bg-[#050a15] text-white font-sans overflow-hidden">
            {/* Sidebar - Categories & List */}
            <div className="w-80 bg-[#0a1222] border-r border-cyan-900/30 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-cyan-900/30 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-cyan-400">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-bold tracking-wide uppercase text-xs">Code Library</span>
                    </div>
                    <button className="p-1 hover:bg-cyan-900/50 rounded-md transition-colors text-cyan-600 hover:text-cyan-400">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-cyan-700" />
                        <input
                            type="text"
                            placeholder="Search patterns..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#050a15] border border-cyan-900/50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 text-cyan-100 placeholder-cyan-900"
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedCategory === cat
                                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_#00f2ff33]'
                                    : 'bg-[#050a15] border-cyan-900/30 text-slate-500 hover:border-cyan-700 hover:text-cyan-400'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Snippet List */}
                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
                    {filteredSnippets.map(snippet => (
                        <button
                            key={snippet.id}
                            onClick={() => setSelectedSnippet(snippet)}
                            className={`w-full text-left p-3 rounded-xl border transition-all group ${selectedSnippet?.id === snippet.id
                                ? 'bg-cyan-900/20 border-cyan-500/50 shadow-md'
                                : 'bg-transparent border-transparent hover:bg-[#0f172a] hover:border-cyan-900/30'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold text-sm ${selectedSnippet?.id === snippet.id ? 'text-cyan-300' : 'text-slate-300 group-hover:text-cyan-100'}`}>
                                    {snippet.title}
                                </span>
                                <span className="text-[9px] uppercase font-mono text-slate-600 bg-[#050a15] px-1.5 py-0.5 rounded border border-cyan-900/20">
                                    {snippet.language}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {snippet.tags.map(tag => (
                                    <span key={tag} className="text-[9px] text-cyan-700">#{tag}</span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content - Preview */}
            <div className="flex-1 bg-[#050a15] flex flex-col relative">
                {selectedSnippet ? (
                    <>
                        {/* Toolbar */}
                        <div className="h-14 border-b border-cyan-900/30 flex items-center justify-between px-6 bg-[#0a1222]/50 backdrop-blur">
                            <div className="flex items-center space-x-3">
                                <Code className="w-5 h-5 text-cyan-600" />
                                <h2 className="font-bold text-lg text-cyan-100">{selectedSnippet.title}</h2>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleInject(selectedSnippet)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
                                >
                                    <ArrowRightCircle className="w-4 h-4" />
                                    <span>Inject</span>
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        {selectedSnippet.description && (
                            <div className="px-6 py-4 border-b border-cyan-900/10 bg-cyan-950/5 text-slate-400 text-sm">
                                {selectedSnippet.description}
                            </div>
                        )}

                        {/* Code View */}
                        <div className="flex-1 overflow-auto p-6 font-mono text-sm relative">
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={() => navigator.clipboard.writeText(selectedSnippet.code)}
                                    className="p-2 bg-[#0a1222] border border-cyan-900/30 rounded text-slate-400 hover:text-white transition-colors"
                                    title="Copy to Clipboard"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                            <pre className="bg-[#0a1222] p-6 rounded-2xl border border-cyan-900/30 text-cyan-50 shadow-inner min-h-full">
                                <code>{selectedSnippet.code}</code>
                            </pre>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-cyan-900/40 space-y-4">
                        <BookOpen className="w-16 h-16 opacity-50" />
                        <p className="font-mono text-xs uppercase tracking-[0.2em]">Select a snippet pattern</p>
                    </div>
                )}
            </div>
        </div>
    );
};
