import * as vscode from 'vscode';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { UnlocalizedString, UnlocalizedStringsProvider } from './UnlocalizedStringsProvider';



let hasFoundUnlocalizedStrings = false;
export function activate(context: vscode.ExtensionContext) {
  const treeDataProvider = new UnlocalizedStringsProvider();

  vscode.window.createTreeView('unlocalizedStringsView', { treeDataProvider });

  const disposable = vscode.commands.registerCommand('discover-unlocalised.findUnlocalizedStrings', async () => {

    //Ask for the project directory
    const projectDirectory = await vscode.window.showInputBox({
      placeHolder: 'Enter the project directory',
      value: vscode.workspace.rootPath || '',
    });

    if (!projectDirectory) {
      vscode.window.showErrorMessage('No project directory provided.');
      return;
    }

    // Ask for the localization helpers
    const localizationHelpersInput = await vscode.window.showInputBox({
      placeHolder: 'Enter the localization helper functions (comma-separated)',
      value: 'getCustomizationResources, getMessageLocal',
    });

    if (!localizationHelpersInput) {
      vscode.window.showErrorMessage('No localization helpers provided.');
      return;
    }
    // Ask for the html attributew\s
    const attributesInput = await vscode.window.showInputBox({
      placeHolder: 'Enter the attributes to check (comma-separated)',
      value: 'title, aria-label, placeholder', 
    });

    const attributesToCheck = attributesInput ? attributesInput.split(',').map(attr => attr.trim()) : ['title', 'aria-label', 'placeholder'];

    const localizationHelpers = localizationHelpersInput.split(',').map(helper => helper.trim());

    const unlocalizedStrings = await scanCodebase(projectDirectory, localizationHelpers, attributesToCheck);

    // Memorize all unlocalized strings
    treeDataProvider.memorizeUnlocalizedStrings(unlocalizedStrings);

    // Prepare unlocalized string items for TreeView
    const treeItems = Object.keys(unlocalizedStrings).reduce((acc, file) => {
      acc[file] = unlocalizedStrings[file].map(
        (str: any) => new UnlocalizedString(`"${str.value}"`, file, str.line, file)
      );
      return acc;
    }, {} as { [file: string]: UnlocalizedString[] });
    
    // Refresh the TreeView to display unlocalized strings
    treeDataProvider.refresh(treeItems);
    hasFoundUnlocalizedStrings = true;
    const firstUnlocalizedString = unlocalizedStrings[Object.keys(unlocalizedStrings)[0]]?.[0] || null;
    if (firstUnlocalizedString) {
        vscode.commands.executeCommand('discover-unlocalised.navigateToUnlocalizedString', firstUnlocalizedString);
    }
  });

  context.subscriptions.push(vscode.commands.registerCommand('discover-unlocalised.navigateToUnlocalizedString', (unlocalizedString: UnlocalizedString | null) => {
    hasFoundUnlocalizedStrings = false;
    const memorizedStrings = treeDataProvider.getMemorizedUnlocalizedStrings();

    // If there is no selected string but memorized strings are available, use the memorized strings to populate the tree
    if (!unlocalizedString && memorizedStrings && Object.keys(memorizedStrings).length > 0) {
      const treeItems = Object.keys(memorizedStrings).reduce((acc, file) => {
        acc[file] = memorizedStrings[file].map(
          (str: any) => new UnlocalizedString(`"${str.value}"`, file, str.line, file)
        );
        return acc;
      }, {} as { [file: string]: UnlocalizedString[] });
      treeDataProvider.refresh(treeItems);
      return;
    }

    if (!unlocalizedString) {
      vscode.window.showErrorMessage('No unlocalized string selected and no memorized strings found.');
      return;
    }

    const fileUri = vscode.Uri.file(path.resolve(vscode.workspace.rootPath || '', unlocalizedString.file));
    const lineNumber = unlocalizedString.line - 1; // Line numbers are 0-based in VS Code
    const range = new vscode.Range(lineNumber, 0, lineNumber, 0);

    // Open the file and navigate to the line
    vscode.workspace.openTextDocument(fileUri).then((doc) => {
      vscode.window.showTextDocument(doc).then((editor) => {
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        editor.selection = new vscode.Selection(range.start, range.end);
      });
    });
  }));

  context.subscriptions.push(disposable);
}

export function deactivate() {}

async function scanCodebase(projectDirectory: string, localizationHelpers: string[], attributesToCheck: string[]) {
  const unlocalizedStrings: { [file: string]: any[] } = {};

  // Recursively search for files in the project directory
  const files = glob.sync(`${projectDirectory}/**/*.{js,jsx,ts,tsx}`, {
    ignore: '**/node_modules/**',
  });

  for (const file of files) {

    const fileContent = fs.readFileSync(file, 'utf-8');
    const ast = parser.parse(fileContent, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    traverse(ast, {
      JSXText(path: any) {
        const textValue = path.node.value.trim();
        if (textValue && !isLocalized(path.node, localizationHelpers)) {
          if (!unlocalizedStrings[file]) {
            unlocalizedStrings[file] = [];
          }
          unlocalizedStrings[file].push({
            type: 'InnerText',
            value: textValue,
            line: path.node.loc?.start.line,
          });
        }
      },
      JSXAttribute(path: any) {
        const { name, value } = path.node;
        if (
          value &&
          value.type === 'StringLiteral' &&
          attributesToCheck.includes((name as any).name) &&
          !isLocalized(value, localizationHelpers)
        ) {
          if (!unlocalizedStrings[file]) {
            unlocalizedStrings[file] = [];
          }
          unlocalizedStrings[file].push({
            type: 'Attribute',
            name: name.name,
            value: value.value,
            line: path.node.loc?.start.line,
          });
        }
      },
    });
  }

  return unlocalizedStrings;
}

function isLocalized(node: any, localizationHelpers: string[]) {
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
    return localizationHelpers.includes(node.callee.name);
  }
  return false;
}
