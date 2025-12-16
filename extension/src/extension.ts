import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar-provider';

export function activate(context: vscode.ExtensionContext): void {
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('envhaven.sidebarView', sidebarProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('envhaven.refreshSidebar', () => {
      sidebarProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('envhaven.installOhMyOpenCode', async () => {
      const terminal = vscode.window.createTerminal('Install oh-my-opencode');
      const installCmd = `mkdir -p ~/.config/opencode && \\
        jq '.plugin = ((.plugin // []) + ["oh-my-opencode"] | unique)' \\
        ~/.config/opencode/opencode.json 2>/dev/null > /tmp/oc.json && \\
        mv /tmp/oc.json ~/.config/opencode/opencode.json || \\
        echo '{"plugin":["oh-my-opencode"]}' > ~/.config/opencode/opencode.json`;
      terminal.sendText(installCmd);
      terminal.show();
      vscode.window.showInformationMessage('Installing oh-my-opencode plugin...');
    })
  );

  setTimeout(() => {
    vscode.commands.executeCommand('workbench.view.extension.envhaven-sidebar');
  }, 1000);
}

export function deactivate(): void {}
