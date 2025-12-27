import React, { useRef, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoEditorProps {
    content: string;
    filename: string;
    onChange: (content: string) => void;
    theme?: 'vs-dark' | 'light';
    readOnly?: boolean;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
    content,
    filename,
    onChange,
    theme = 'vs-dark',
    readOnly = false
}) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        // Custom Nexus Theme
        monaco.editor.defineTheme('nexus-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '517d91', fontStyle: 'italic' },
                { token: 'keyword', foreground: '00f2ff', fontStyle: 'bold' },
                { token: 'identifier', foreground: 'e0f7fa' },
                { token: 'type', foreground: 'ff1744' },
                { token: 'string', foreground: 'ffab40' },
            ],
            colors: {
                'editor.background': '#050a15',
                'editor.foreground': '#e0f7fa',
                'editor.lineHighlightBackground': '#00f2ff11',
                'editorCursor.foreground': '#00f2ff',
                'editor.selectionBackground': '#00f2ff33',
                'editor.inactiveSelectionBackground': '#00f2ff11',
            }
        });

        monaco.editor.setTheme('nexus-dark');
    };

    const handleEditorChange: OnChange = (value) => {
        if (value !== undefined) {
            onChange(value);
        }
    };

    // Determine language by filename
    const getLanguage = (file: string) => {
        const ext = file.split('.').pop();
        switch (ext) {
            case 'tsx':
            case 'ts': return 'typescript';
            case 'jsx':
            case 'js': return 'javascript';
            case 'css': return 'css';
            case 'json': return 'json';
            case 'html': return 'html';
            case 'md': return 'markdown';
            default: return 'plaintext';
        }
    };

    return (
        <div className="h-full w-full border border-cyan-900/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <Editor
                height="100%"
                defaultLanguage={getLanguage(filename)}
                language={getLanguage(filename)}
                value={content}
                theme="nexus-dark"
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    readOnly,
                    minimap: { enabled: true, scale: 0.75 },
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                    fontLigatures: true,
                    lineNumbers: 'on',
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 20, bottom: 20 },
                    smoothScrolling: true,
                    cursorSmoothCaretAnimation: 'on',
                    cursorBlinking: 'expand',
                    bracketPairColorization: { enabled: true },
                    formatOnPaste: true,
                    formatOnType: true,
                }}
            />
        </div>
    );
};

export default MonacoEditor;
