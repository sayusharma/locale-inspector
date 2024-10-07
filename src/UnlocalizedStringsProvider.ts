import * as path from "path";
import * as vscode from "vscode";

export class UnlocalizedString {
  constructor(
    public label: string,
    public description: string,
    public line: number,
    public file: string
  ) {}
  getIcon() {
    return {
      light: path.join(__filename, '..', '..', 'resources', 'light', 'warning.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', 'warning.svg'),
    };
  }
}

export class UnlocalizedFile extends vscode.TreeItem {
  constructor(
    public readonly label: string, // This will be the file name
    public readonly collapsibleState: vscode.TreeItemCollapsibleState, // Make it collapsible
    public readonly filePath: string // Store the full file path
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.filePath}`;
    this.description = filePath;
    this.iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'file.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'file.svg'),
    };
  }

  command = undefined;
}

export class UnlocalizedStringsProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined
  > = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> =
    this._onDidChangeTreeData.event;

  private unlocalizedStrings: { [file: string]: UnlocalizedString[] } = {};
  private memorizedUnlocalizedStrings: { [file: string]: any[] } = {}; 

  constructor() {}

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: vscode.TreeItem
  ): vscode.TreeItem[] | Thenable<vscode.TreeItem[]> {
    if (element instanceof UnlocalizedFile) {
      const file = element.filePath;
      const unlocalizedStringsForFile = this.unlocalizedStrings[file] || [];

      return unlocalizedStringsForFile.map((str) => {
        const lineItem = new vscode.TreeItem(
          `${str.line}: ${str.label}`,
          vscode.TreeItemCollapsibleState.None
        );
        lineItem.command = {
          command: "discover-unlocalised.navigateToUnlocalizedString",
          title: "Navigate to Unlocalized String",
          arguments: [str], 
        };
        return lineItem;
      });
    }

    return Object.keys(this.unlocalizedStrings).map(
      (file) =>
        new UnlocalizedFile(
          path.basename(file),
          vscode.TreeItemCollapsibleState.Collapsed,
          file
        )
    );
  }

  refresh(unlocalizedStrings: { [file: string]: UnlocalizedString[] }) {
    this.unlocalizedStrings = unlocalizedStrings;
    this._onDidChangeTreeData.fire(undefined);
  }

  memorizeUnlocalizedStrings(allUnlocalizedStrings: { [file: string]: any[] }) {
    this.memorizedUnlocalizedStrings = allUnlocalizedStrings;
  }

  getMemorizedUnlocalizedStrings() {
    return this.memorizedUnlocalizedStrings; 
  }
}
