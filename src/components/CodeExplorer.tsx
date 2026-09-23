import React, { useState, useEffect } from 'react';
import {
  FileText,
  Folder,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  Shield,
  Layers,
  ExternalLink,
} from 'lucide-react';
import JSZip from 'jszip';

interface ProjectFile {
  path: string;
  name: string;
  language: string;
  content: string;
}

const DEFAULT_FILES: ProjectFile[] = [
  {
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    content: `# 📻 DemeRadio 94.9 FM\n\n> La emisora en español dedicada a la comunidad de Demenishki.\n\nConsulta el código completo en la cabina.`,
  },
  {
    path: 'prompts/system_prompt.txt',
    name: 'prompts/system_prompt.txt',
    language: 'text',
    content: `[ROL]\nEres el locutor oficial de "DemeRadio 94.9 FM", la emisora en español dedicada a la comunidad de Demenishki...`,
  },
  {
    path: 'requirements.txt',
    name: 'requirements.txt',
    language: 'text',
    content: `google-genai>=1.0.0\npython-dotenv>=1.0.1\nedge-tts>=6.1.12\ngTTS>=2.5.1\npygame>=2.5.2\nrich>=13.7.1`,
  },
  {
    path: 'src/main.py',
    name: 'src/main.py',
    language: 'python',
    content: `# DemeRadio 94.9 FM - Punto de Entrada Principal (main.py)`,
  },
  {
    path: 'src/config.py',
    name: 'src/config.py',
    language: 'python',
    content: `# DemeRadio 94.9 FM - Módulo de Configuración (config.py)`,
  },
  {
    path: 'src/audio_engine.py',
    name: 'src/audio_engine.py',
    language: 'python',
    content: `# DemeRadio 94.9 FM - Motor de Audio y Síntesis de Voz (audio_engine.py)`,
  },
  {
    path: 'LICENSE',
    name: 'LICENSE',
    language: 'text',
    content: `MIT License\n\nCopyright (c) 2026 DemeRadio Community...`,
  },
];

export const CodeExplorer: React.FC = () => {
  const [files, setFiles] = useState<ProjectFile[]>(DEFAULT_FILES);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('src/main.py');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/project/files')
      .then((res) => res.json())
      .then((data) => {
        if (data.files && Array.isArray(data.files)) {
          setFiles(data.files);
        }
      })
      .catch((err) => console.warn('Could not load files from server, using embedded state:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const handleCopyCode = async () => {
    if (!selectedFile) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleDownloadSingleFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.path.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      const zip = new JSZip();

      // Añadir cada archivo al ZIP respetando carpetas
      files.forEach((file) => {
        zip.file(file.path, file.content);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'demeradio-94-9fm-opensource.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  const getFileIcon = (path: string) => {
    if (path.endsWith('.py')) return <FileCode className="w-4 h-4 text-emerald-400" />;
    if (path.endsWith('.md')) return <FileText className="w-4 h-4 text-cyan-400" />;
    if (path === 'LICENSE') return <Shield className="w-4 h-4 text-amber-400" />;
    if (path.endsWith('.txt')) return <FileText className="w-4 h-4 text-purple-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MIT Open Source
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Python 3.10+
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Gemini AI
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Repositorio y Módulos de Código
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Estructura modular limpia: configuración, motor de audio con modulación de pitch/rate y punto de entrada CLI.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloadingZip ? 'Comprimiendo ZIP...' : 'Descargar ZIP Completo'}
          </button>
        </div>
      </div>

      {/* Main Grid: File Tree + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: File Tree */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 shadow-xl flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Folder className="w-4 h-4 text-cyan-400" />
              demeradio-94-9fm/
            </span>
            <span>{files.length} archivos</span>
          </div>

          <div className="space-y-1.5 font-mono text-sm overflow-y-auto max-h-[480px]">
            {/* Root files */}
            <div className="text-xs text-slate-500 px-2 py-1 font-semibold uppercase">Raíz del Proyecto</div>
            {files
              .filter((f) => !f.path.includes('/'))
              .map((file) => {
                const isSelected = selectedFilePath === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {getFileIcon(file.path)}
                      <span className="truncate">{file.path}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans">
                      {file.content.split('\n').length} líneas
                    </span>
                  </button>
                );
              })}

            {/* prompts/ folder */}
            <div className="text-xs text-slate-500 px-2 pt-3 pb-1 font-semibold uppercase flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-purple-400" />
              prompts/
            </div>
            {files
              .filter((f) => f.path.startsWith('prompts/'))
              .map((file) => {
                const isSelected = selectedFilePath === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 pl-6 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {getFileIcon(file.path)}
                      <span className="truncate">{file.path.replace('prompts/', '')}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans">
                      {file.content.split('\n').length} líneas
                    </span>
                  </button>
                );
              })}

            {/* src/ folder */}
            <div className="text-xs text-slate-500 px-2 pt-3 pb-1 font-semibold uppercase flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-emerald-400" />
              src/
            </div>
            {files
              .filter((f) => f.path.startsWith('src/'))
              .map((file) => {
                const isSelected = selectedFilePath === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 pl-6 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {getFileIcon(file.path)}
                      <span className="truncate">{file.path.replace('src/', '')}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans">
                      {file.content.split('\n').length} líneas
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Quick CLI tip */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Ejecución local en tu terminal:
              </div>
              <code className="text-cyan-300 font-mono text-[11px] block select-all">
                python src/main.py --mood energetico
              </code>
            </div>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden flex flex-col">
          {/* File Tab Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
            <div className="flex items-center gap-2 font-mono text-sm text-slate-200">
              {selectedFile && getFileIcon(selectedFile.path)}
              <span className="font-semibold text-white">{selectedFile?.path}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-sans">
                {selectedFile?.language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
                title="Copiar código al portapapeles"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadSingleFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
                title="Descargar este archivo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Bajar archivo</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Body */}
          <div className="relative flex-1 bg-slate-950 p-4 font-mono text-xs overflow-auto max-h-[580px] leading-relaxed select-text text-slate-300">
            <pre className="whitespace-pre">
              {selectedFile?.content.split('\n').map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/60">
                  <span className="table-cell pr-4 text-right select-none text-slate-600 w-10">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre-wrap break-all text-slate-200">
                    {line || ' '}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
