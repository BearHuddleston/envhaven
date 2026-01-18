import { Plus, SquareTerminal, X } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useWorkspaceStore } from '../stores/workspace-store';
import { vscode, type TmuxWindow } from '../lib/vscode';

function TerminalRow({ window }: { window: TmuxWindow }) {
  const handleClick = () => {
    vscode.postMessage({ command: 'switchTerminal', windowIndex: window.index });
  };

  const handleKill = (e: React.MouseEvent) => {
    e.stopPropagation();
    vscode.postMessage({ command: 'killTerminal', windowIndex: window.index });
  };

  return (
    <div
      onClick={handleClick}
      className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/30 px-2 hover:bg-accent"
    >
      <SquareTerminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-sm">{window.name}</span>
      <div className="group relative flex h-4 w-4 shrink-0 items-center justify-center">
        <span
          className={`absolute h-2 w-2 rounded-full transition-opacity group-hover:opacity-0 ${
            window.active ? 'bg-success' : 'bg-muted-foreground/40'
          }`}
        />
        <button
          onClick={handleKill}
          className="absolute flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity hover:bg-destructive/20 group-hover:opacity-100"
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>
  );
}

export function TerminalsPanel() {
  const { workspace } = useWorkspaceStore();

  const handleNewTerminal = () => {
    vscode.postMessage({ command: 'newTerminal' });
  };

  const windows = workspace?.tmuxWindows ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-section-header">
          Terminals
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleNewTerminal}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Terminal</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {windows.length === 0 ? (
        <div className="text-xs text-muted-foreground">No terminal sessions</div>
      ) : (
        <div className="space-y-1">
          {windows.map((window) => (
            <TerminalRow key={window.index} window={window} />
          ))}
        </div>
      )}
    </div>
  );
}
