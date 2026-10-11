import { ProgressBar } from '@heroui/react';
import { CloudDownload } from 'lucide-react';
import type { copyFor } from './copy';

export function ModelDownloadProgress({
  progress,
  copy,
  id = 'model-download',
  title = copy.modelDownloadTitle,
  note = copy.modelDownloadNote,
}: {
  progress: number;
  copy: ReturnType<typeof copyFor>;
  /** Prefix for element ids, so two downloads can show at once. */
  id?: string;
  title?: string;
  note?: string;
}) {
  return (
    <div className="model-download space-y-3">
      <ProgressBar
        className="model-progress"
        value={progress}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-note`}
      >
        <span id={`${id}-label`} className="flex items-center gap-2 text-text font-semibold">
          <CloudDownload size={18} />
          {title}
        </span>
        <ProgressBar.Output className="model-progress-output" />
        <ProgressBar.Track className="model-progress-track">
          <ProgressBar.Fill className="model-progress-fill" />
        </ProgressBar.Track>
      </ProgressBar>
      <p id={`${id}-note`} className="text-sm text-secondary">
        {note}
      </p>
    </div>
  );
}
