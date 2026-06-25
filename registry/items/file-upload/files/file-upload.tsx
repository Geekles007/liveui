'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

type UploadStatus = 'uploading' | 'success' | 'error';

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  /** 0–100. Stays 0 if your uploader never reports progress. */
  progress: number;
  error?: string;
  /** Validation failures (e.g. too large) can't be retried. */
  canRetry: boolean;
}

export interface FileUploadProps {
  /**
   * Upload a single file. Call `onProgress(0..100)` as it uploads to drive the
   * progress bar; resolve when done, reject to surface a retryable error.
   */
  upload: (file: File, onProgress: (pct: number) => void) => Promise<unknown>;
  /** Restrict the file picker, e.g. "image/*". */
  accept?: string;
  /** Allow more than one file. Default true. */
  multiple?: boolean;
  /** Reject files larger than this many bytes before uploading. */
  maxSize?: number;
  /** Instruction text and accessible name for the dropzone. */
  label?: string;
  disabled?: boolean;
  /** Called when a file finishes uploading, with whatever `upload` resolved to. */
  onComplete?: (file: File, result: unknown) => void;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let seq = 0;

/**
 * A drag-and-drop file dropzone that uploads each file on its own and survives
 * partial failure: every file gets its own progress bar, and a failed upload
 * shows a Retry button instead of sinking the whole batch.
 *
 *   <FileUpload upload={(file, onProgress) => api.upload(file, onProgress)} accept="image/*" />
 *
 * Accessibility: the dropzone is a keyboard-operable button (Enter / Space open
 * the picker), each file exposes a `role="progressbar"`, and status changes are
 * announced through a polite live region.
 */
export function FileUpload({
  upload,
  accept,
  multiple = true,
  maxSize,
  label = 'Drag files here, or click to browse',
  disabled = false,
  onComplete,
  className,
}: FileUploadProps) {
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [announce, setAnnounce] = React.useState('');

  const inputRef = React.useRef<HTMLInputElement>(null);
  const uploadRef = React.useRef(upload);
  uploadRef.current = upload;
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const patch = React.useCallback((id: string, next: Partial<UploadItem>) => {
    if (!mounted.current) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...next } : it)));
  }, []);

  const start = React.useCallback(
    (id: string, file: File) => {
      patch(id, { status: 'uploading', progress: 0, error: undefined, canRetry: true });
      uploadRef
        .current(file, (pct) => {
          patch(id, { progress: Math.max(0, Math.min(100, Math.round(pct))) });
        })
        .then(
          (result) => {
            patch(id, { status: 'success', progress: 100 });
            if (mounted.current) setAnnounce(`${file.name} uploaded`);
            onCompleteRef.current?.(file, result);
          },
          (err: unknown) => {
            patch(id, {
              status: 'error',
              error: err instanceof Error ? err.message : 'Upload failed',
            });
            if (mounted.current) setAnnounce(`${file.name} failed to upload`);
          },
        );
    },
    [patch],
  );

  const addFiles = React.useCallback(
    (fileList: FileList | File[]) => {
      if (disabled) return;
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const next: UploadItem[] = files.map((file) => {
        const id = `f${++seq}`;
        if (maxSize != null && file.size > maxSize) {
          return {
            id,
            file,
            status: 'error',
            progress: 0,
            error: `File is larger than ${formatSize(maxSize)}`,
            canRetry: false,
          };
        }
        return { id, file, status: 'uploading', progress: 0, canRetry: true };
      });

      setItems((prev) => (multiple ? [...prev, ...next] : next));
      for (const it of next) {
        if (it.status === 'uploading') start(it.id, it.file);
      }
    },
    [disabled, maxSize, multiple, start],
  );

  const remove = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));
  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* biome-ignore lint/a11y/useSemanticElements: a div with role=button keeps the dropzone separate from the hidden native input it triggers. */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-muted/50',
        )}
      >
        <svg
          aria-hidden="true"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
        </svg>
        <span className="text-muted-foreground">{label}</span>
      </div>

      {/* Kept outside the role=button dropzone so the two interactive elements
          don't nest; the dropzone triggers it through the ref. */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = ''; // allow re-selecting the same file
        }}
      />

      {/* Polite live region: announced, not seen. */}
      <span role="status" aria-live="polite" className="sr-only">
        {announce}
      </span>

      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-foreground">{it.file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatSize(it.file.size)}
                  </span>
                </div>

                {it.status === 'error' ? (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {it.error}
                  </p>
                ) : (
                  <div
                    role="progressbar"
                    tabIndex={-1}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={it.progress}
                    aria-label={
                      it.status === 'success'
                        ? `${it.file.name} uploaded`
                        : `Uploading ${it.file.name}`
                    }
                    className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        it.status === 'success' ? 'bg-primary' : 'bg-primary/70',
                      )}
                      style={{ width: `${it.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {it.status === 'error' && it.canRetry && (
                <button
                  type="button"
                  onClick={() => start(it.id, it.file)}
                  className="shrink-0 rounded-md border border-destructive/40 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label={`Remove ${it.file.name}`}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg
                  aria-hidden="true"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
